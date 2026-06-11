import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, FileText, UploadCloud, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface ImportResult {
  created: number;
  duplicates: number;
  skipped: number;
  total_rows: number;
}

const ImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchAccounts, importTransactionsCsv } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    fetchAccounts()
      .then((data) => setAccounts(data || []))
      .catch(() => setAccounts([]));
  }, [fetchAccounts]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    maxFiles: 1,
    onDrop: (accepted) => {
      if (accepted.length > 0) {
        setFile(accepted[0]);
        setResult(null);
      }
    },
  });

  const handleImport = async () => {
    if (!file) {
      toast.error('Sélectionnez un fichier CSV.');
      return;
    }
    setIsImporting(true);
    try {
      const data = await importTransactionsCsv(file, accountId || undefined);
      setResult(data);
      toast.success(data.message || 'Import terminé.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "L'import a échoué.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container py-8 max-w-2xl">
      <button
        onClick={() => navigate('/transactions')}
        className="inline-flex items-center text-sm text-muted hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux transactions
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-2">Importer des transactions</h1>
      <p className="text-muted mb-8">
        Importez un relevé au format CSV. Les colonnes <strong>date</strong>, <strong>libellé</strong> et{' '}
        <strong>montant</strong> (ou <strong>débit</strong>/<strong>crédit</strong>) sont détectées
        automatiquement. Les doublons sont ignorés.
      </p>

      <div className="card p-6 space-y-6">
        <div>
          <label htmlFor="import-account" className="label">Compte de destination (optionnel)</label>
          <select
            id="import-account"
            className="input"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">— Aucun compte —</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60'
          }`}
        >
          <input {...getInputProps()} aria-label="Fichier CSV à importer" />
          {file ? (
            <div className="flex items-center justify-center text-foreground">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              <span className="font-medium">{file.name}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-muted">
              <UploadCloud className="h-10 w-10 mb-3 text-primary/70" />
              <p className="font-medium text-foreground">Glissez votre fichier CSV ici</p>
              <p className="text-sm">ou cliquez pour le sélectionner</p>
            </div>
          )}
        </div>

        <Button
          variant="primary"
          className="w-full justify-center"
          onClick={handleImport}
          isLoading={isImporting}
          disabled={!file}
        >
          Importer
        </Button>

        {result && (
          <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-sm">
            <div className="flex items-center text-success font-medium mb-2">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Import terminé
            </div>
            <ul className="text-foreground space-y-1">
              <li>{result.created} transaction(s) importée(s)</li>
              <li>{result.duplicates} doublon(s) ignoré(s)</li>
              {result.skipped > 0 && <li>{result.skipped} ligne(s) ignorée(s) (date manquante)</li>}
            </ul>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/transactions')}
            >
              Voir les transactions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPage;
