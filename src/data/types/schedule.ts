export interface Schedule {
    displayName: string;
    school: School;
    finishesAt: {
        monday: number | null;
        tuesday: number | null;
        wednesday: number | null;
        thursday: number | null;
        friday: number | null;
    };
    schedule: {
        monday: Course[];
        tuesday: Course[];
        wednesday: Course[];
        thursday: Course[];
        friday: Course[];
    };
}

export interface Course {
    className: string;
    startTime: number;
    endTime: number;
    rooms?: string[];
};

export enum School {
    Vanier = "Vanier",
    Bdeb = "Bois-de-Boulogne",
    Other = "Other",
    All = "All"
};

export enum SchoolKeys {
    Vanier = 1,
    Bdeb = 2,
    Other = 3,
    All = 4
}

export enum Weekdays {
    monday = "monday",
    tuesday = "tuesday",
    wednesday = "wednesday",
    thursday = "thursday",
    friday = "friday"
}
