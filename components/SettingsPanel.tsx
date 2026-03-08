type Difficulty = 'let' | 'mellem' | 'svaer';
type Tempo = 'hurtig' | 'normal' | 'rolig';
type Theme = 'classic' | 'forest' | 'ocean';

type Props = {
  difficulty: Difficulty;
  tempo: Tempo;
  theme: Theme;
  showEvalBar: boolean;
  showCoordinates: boolean;
  voiceEnabled: boolean;
  voiceSupported: boolean;
  onDifficultyChange: (value: Difficulty) => void;
  onTempoChange: (value: Tempo) => void;
  onThemeChange: (value: Theme) => void;
  onShowEvalBarChange: (value: boolean) => void;
  onShowCoordinatesChange: (value: boolean) => void;
  onVoiceEnabledChange: (value: boolean) => void;
};

export default function SettingsPanel({
  difficulty,
  tempo,
  theme,
  showEvalBar,
  showCoordinates,
  voiceEnabled,
  voiceSupported,
  onDifficultyChange,
  onTempoChange,
  onThemeChange,
  onShowEvalBarChange,
  onShowCoordinatesChange,
  onVoiceEnabledChange,
}: Props) {
  return (
    <div className="panel">
      <h2>Indstillinger</h2>

      <div className="settingsGrid">
        <label className="settingField">
          <span>Sværhedsgrad</span>
          <select value={difficulty} onChange={(event) => onDifficultyChange(event.target.value as Difficulty)}>
            <option value="let">Let</option>
            <option value="mellem">Mellem</option>
            <option value="svaer">Svær</option>
          </select>
        </label>

        <label className="settingField">
          <span>Tema</span>
          <select value={theme} onChange={(event) => onThemeChange(event.target.value as Theme)}>
            <option value="classic">Klassisk</option>
            <option value="forest">Skov</option>
            <option value="ocean">Hav</option>
          </select>
        </label>

        <label className="settingField">
          <span>Analysehastighed</span>
          <select value={tempo} onChange={(event) => onTempoChange(event.target.value as Tempo)}>
            <option value="hurtig">Hurtig</option>
            <option value="normal">Normal</option>
            <option value="rolig">Rolig</option>
          </select>
        </label>
      </div>

      <div className="toggleList">
        <label className="toggleRow">
          <input
            checked={showEvalBar}
            onChange={(event) => onShowEvalBarChange(event.target.checked)}
            type="checkbox"
          />
          <span>Vis evalueringsbar</span>
        </label>

        <label className="toggleRow">
          <input
            checked={showCoordinates}
            onChange={(event) => onShowCoordinatesChange(event.target.checked)}
            type="checkbox"
          />
          <span>Vis koordinater</span>
        </label>

        <label className={`toggleRow${!voiceSupported ? ' toggleRowDisabled' : ''}`}>
          <input
            checked={voiceEnabled}
            disabled={!voiceSupported}
            onChange={(event) => onVoiceEnabledChange(event.target.checked)}
            type="checkbox"
          />
          <span>{voiceSupported ? 'Læs coachen højt automatisk' : 'Stemme ikke tilgængelig i denne browser'}</span>
        </label>
      </div>
    </div>
  );
}
