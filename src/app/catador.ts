import { Phone } from './phone'
import { Material } from './material';


export class Catador {

    public id: number = 0;
    public name: string = '';
    public prefererUseName: boolean = true;
    public email: string = '';
    public password: string = '';
    public minibio: string = '';
    public username: string = '';
    public nickname: string = '';
    public presentation_phrase: string = '';
    public birthDay: Date = new Date();
    public phones: Array<Phone> = new Array<Phone>();
    public address_base: string = '';
    public region: string = '';
    public kg_week: number;
    public how_many_days_work_week: number;
    public how_many_years_work: number;
    public belongsCooperative: boolean = false;
    public cooperative_name: string = '';
    public iron_work: string = '';
    public materials_collected: Array<Material> = new Array<Material>();
    public safety_kit: boolean = false;
    public has_motor_vehicle: boolean = false;
    public has_smartphone_with_internet: boolean = false;
    public image: string = '';
    public user: string = '';

}
