'use client';

interface AiModeSectionProps {
  aiMode: boolean;
  onToggle: () => void;
  aiDescription: string;
  onDescriptionChange: (value: string) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  hasFiles: boolean;
}

export function AiModeSection({
  aiMode,
  onToggle,
  aiDescription,
  onDescriptionChange,
  onAnalyze,
  analyzing,
  hasFiles,
}: AiModeSectionProps) {
  return (
    <>
      {/* Toggle AI Mode */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mode AI (Remplissage automatique)
          </label>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Utilisez l'IA pour analyser les images et remplir
            automatiquement les champs
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            aiMode ? 'bg-primary-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              aiMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* AI Description Field */}
      {aiMode && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <label
            htmlFor="aiDescription"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description du produit (pour l'analyse AI) *
          </label>
          <textarea
            id="aiDescription"
            value={aiDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={2}
            className="focus:ring-primary-500 focus:border-primary-500 mb-3 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Ex: Jeans Zara hombre talle 42/44 anchos a $50.000"
          />
          <button
            type="button"
            onClick={onAnalyze}
            disabled={analyzing || !aiDescription.trim() || !hasFiles}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? 'Analyse en cours...' : 'Analyser avec AI'}
          </button>
        </div>
      )}
    </>
  );
}

