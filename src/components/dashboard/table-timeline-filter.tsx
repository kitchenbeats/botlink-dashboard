import { SelectRangeEventHandler } from "react-day-picker";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "../ui/date-picker";

interface TableTimelineFilterProps {
  date?: DateRange;
  onDateChange: SelectRangeEventHandler;
  className?: string;
}

export default function TableTimelineFilter({
  className,
  date,
  onDateChange,
}: TableTimelineFilterProps) {
  return (
    <DatePickerWithRange
      className={className}
      date={date}
      onDateChange={onDateChange}
    />
  );
}
