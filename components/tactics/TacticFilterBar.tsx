import type { PuzzleCategory } from '@/data/tactics/puzzles';

export type TacticFilter = 'alle' | PuzzleCategory;

type Props = {
  activeFilter: TacticFilter;
  onFilterChange: (filter: TacticFilter) => void;
};

const filterOptions: Array<{ label: string; value: TacticFilter }> = [
  { label: 'Alle', value: 'alle' },
  { label: 'Mat', value: 'mat' },
  { label: 'Gafler', value: 'gafler' },
  { label: 'Bindinger', value: 'bindinger' },
  { label: 'Materiale', value: 'materiale' },
];

export default function TacticFilterBar({ activeFilter, onFilterChange }: Props) {
  return (
    <div className="filterBar" role="group" aria-label="Filtrer taktikopgaver">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          className={`filterChip${activeFilter === option.value ? ' filterChipActive' : ''}`}
          onClick={() => onFilterChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
