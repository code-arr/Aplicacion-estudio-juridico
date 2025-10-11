export class MeetingDto{
    name : string;
    startAt : string;
    endAt? : string;
    participants : [{name:string, email:string}];
    meetingType : "google-meet" | "in-person";
}