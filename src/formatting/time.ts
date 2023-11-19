export function decimalHoursToHumanReadable(hours: number): string {
    //11.5 -> 11:30
    return `${Math.floor(hours)}`.padStart(2, "0") + ":" + `${Math.floor((hours % 1) * 60)}`.padStart(2, "0");
}
