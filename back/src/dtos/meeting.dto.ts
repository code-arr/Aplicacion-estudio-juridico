export class MeetingDto{
    name : string;
    startAt : string;
    endAt? : string;
    participants : [{name:string, email:string}];
    type : "google-meet" | "in-person";
}