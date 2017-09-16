import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';

import { Catador } from './catador';
import { User } from './user';
import { Phone } from './phone';
import { CatadorDataService } from './catador-data.service';
import { MaterialRecover } from './MaterialRecover';
import { MapsAPILoader } from '@agm/core';
import { GoogleMapsAPIWrapper } from '@agm/core';
import * as _ from 'underscore';
import { Observable } from "rxjs/Rx";



@Component({
    selector: 'app-catador',
    templateUrl: './catador.component.html',
    styleUrls: ['./catador.component.css']
})
export class CatadorComponent implements OnInit {


    public loading: boolean = false;
    public catador: Catador;
    public user: User;
    public materialRecover: MaterialRecover = new MaterialRecover();
    public materialSelected = [];
    public masks: any;

    public mapLatitude: number = -10.314919285813161;
    public mapLongitude: number = -49.21875;
    public zoom: number = 4;

    public markLat: number;
    public markLng: number;
    public avatar: String;

    public checkboxValue;

    //private geocoder: google.maps.Geocoder;


    constructor(private router: Router,
        public catadorDataService: CatadorDataService,
        public http: Http, public gMaps: GoogleMapsAPIWrapper) {
        this.catador = new Catador();
        this.user = new User();
        this.masks = {
            number: ['(', /[1-9]/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]
        };

        //this.geocoder = new google.maps.Geocoder();
    }

    ngOnInit() {
        this.setCurrentPosition();
        $(":file")['filestyle']({
            input: true,
            buttonText: 'Selecionar Imagem',
            //buttonName: 'btn btn-primary',
            icon: false
        });
    }

    goHome() {
        this.router.navigateByUrl('/');
    }

    save() {
        var valid: any = this.catador.valid();
        if (valid !== true) {
            alert('Por favor preencha todos os campos obrigatórios.');
            document.getElementById(valid).focus();
            return;
        }

        if (!this.markLat || !this.markLng) {
            alert('Por favor preencha o endereço');
            return;
        }

        this.loading = true;
        this.user.username = this.guid();
        this.user.password = 'pimp';
        this.user.email = '';
        this.user.first_name = this.catador.name;

        this.catadorDataService.saveUser(this.user).subscribe(res => {
            if (res.status == 201) {
                let data = res.json();
                this.catador.user = data.id;
                this.registerCatador();
            } else {
                console.log('Erro: ' + res);
                this.loading = false;
            }
        }, error => {
            this.loading = false;
            var error = JSON.parse(error._body);
            console.log(error);

            var msg = '';

            _.each(error, function(value, key) {
                msg += ' - ' + value[0] + ' \n';
            })

            alert(msg);
        });

    }

    guid() {
        const s4=()=> Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
    }
    
    registerCatador() {
        let new_material_list = [];
        this.catador.materials_collected.forEach(
            item => { new_material_list.push(item.id) });
        this.catador.materials_collected = new_material_list;

        this.catadorDataService.saveCatador(this.catador)
            .subscribe(res => {
                console.log(res);
                let data = res.json();
                this.catador.id = data.id;

                Observable.forkJoin([
                    this.cadastrarPhones(this.catador.phones),
                    this.cadastrarLocation(this.catador.id),
                    this.cadastrarAvatar(this.catador.user)
                ])
                .subscribe(t=> {
                    this.loading = false;
                    alert('Catador cadastrado com sucesso!');

                    //location.href = "/";
                    this.router.navigateByUrl('/');
                },  err => {
                    console.log(err);
                });
                 
            });
    }

    cadastrarPhones(phones) {
        return this.catadorDataService.registerPhones(phones, this.catador.id);
        // return this.catadorDataService.registerPhones(phones, this.catador.id).subscribe(data => {
        //     console.log(data);
        // }, err => {
        //     console.log(err);
        // });;
    }

    cadastrarLocation(catadorId) {
        var location = {
            latitude: this.markLat,
            longitude: this.markLng
        }

        return this.catadorDataService.updateLocation(location, catadorId);

        // return this.catadorDataService.updateLocation(location, catadorId)
        //     .subscribe(res => {
        //         console.log(res);
        //     });
    }

    cadastrarAvatar(userId) {
        this.avatar = $('#preview').attr('src');
        if (!this.avatar) return;

        return this.catadorDataService.addAvatar({ avatar: this.avatar }, userId);
        // return this.catadorDataService.addAvatar({ avatar: this.avatar }, userId).subscribe(res => {
        //     console.log(res);
        // }, err => {
        //     console.log(err);
        // });
    }

    selectMaterial(material) {
        let materialSelected = this.materialRecover.findMaterial(material);
        this.catador.addMaterialOrRemoveIfAlreadyIncluded(materialSelected);

        if (this.materialSelected.indexOf(material) > -1) {
            this.materialSelected.splice(this.materialSelected.indexOf(material), 1);
        } else {
            this.materialSelected.push(material);
        }
    }

    onClickMap(event: MouseEvent) {
        this.cleanCatadorAddress();
        this.markLat = event['coords'].lat;
        this.markLng = event['coords'].lng;
        this.updateAddress();
    }

    private cleanCatadorAddress() {
        this.catador.address_base = '';
        this.catador.address_region = '';
        this.catador.city = '';
        this.catador.state = '';
        this.catador.country = '';
    }

    updateAddress() {
        let url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + this.markLat + ',' + this.markLng;

        this.http.get(url).subscribe(data => {
            var res = JSON.parse(data['_body']);
            var results = res.results;

            for (var x = 0; x < results[0].address_components.length; x++) {
                let item = results[0].address_components[x];

                if (item.types.indexOf('route') >= 0 || item.types.indexOf('street_address') >= 0) {
                    this.catador.address_base = item.long_name;
                    //this.catador.address_base = item.formatted_address;
                } else if (item.types.indexOf('sublocality') >= 0 || 
                        item.types.indexOf('sublocality_level_1') >= 0) {
                    this.catador.address_region = item.long_name;
                } else if (item.types.indexOf('administrative_area_level_2') >= 0) {
                    this.catador.city = item.long_name;
                    //this.catador.city = item.formatted_address;
                } else if (item.types.indexOf('administrative_area_level_1') >= 0) {
                    this.catador.state = item.long_name;
                    //this.catador.state = item.formatted_address;
                } else if (item.types.indexOf('country') >= 0) {
                    this.catador.country = item.long_name;
                }
            }

        }, err => {
            console.log(err);
        });
    }

    addressFocusOut() {
        let address = '';
        if (this.catador.address_base) 
            address += this.catador.address_base;

        if (this.catador.city)
            address += (address) ? ', ' + this.catador.city : this.catador.city;

        if (this.catador.state)
            address += (address) ? ', ' + this.catador.state : this.catador.state;

        if (this.catador.country)
            address += (address) ? ', ' + this.catador.country : this.catador.country;
        
        this.http.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + address).subscribe(data => {
            var res = JSON.parse(data['_body']);
            var results = res.results;
            if (!results) return;

            var location = results[0]['geometry']['location'];
            this.updateMap(location);
        });
        
        // this.geocoder.geocode({ address: "Montes Claros Minas Gerais" }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
        //         if (status == google.maps.GeocoderStatus.OK) {
        //             return results;
        //         } else {
        //             throw new Error(status.toString());
        //         }
        // });
    }

    updateMap(location: any) {
        this.markLat = location.lat;
        this.markLng = location.lng;
        this.mapLatitude = this.markLat;
        this.mapLongitude = this.markLng;
        this.zoom = 12;
        this.gMaps.setCenter({ lat: this.mapLatitude, lng: this.mapLongitude });
    }



    onMoveMark(event: MouseEvent) {
        this.cleanCatadorAddress();
        this.markLat = event['coords'].lat;
        this.markLng = event['coords'].lng;
        this.updateAddress();
    }

    private setCurrentPosition() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                this.mapLatitude = position.coords.latitude;
                this.mapLongitude = position.coords.longitude;
                this.zoom = 12;

                this.markLat = this.mapLatitude;
                this.markLng = this.mapLongitude;

                this.updateAddress();
            });
        }
    }

    updateAvatarPreview(e: any) {
        $('#preview').attr('src', e.target.result);
    }

    readURL(fileInput) {
        if (fileInput.target.files && fileInput.target.files[0]) {
            var reader = new FileReader();
            reader.onload = this.updateAvatarPreview;
            reader.readAsDataURL(fileInput.target.files[0]);
        }
    }



}