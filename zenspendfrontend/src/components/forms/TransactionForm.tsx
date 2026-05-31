import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { useDropzone } from 'react-dropzone';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { fr } from 'date-fns/locale';
import { Calendar, Upload, MapPin, Repeat, Tags, Receipt, Sparkles, TrendingDown, TrendingUp, X, Check } from 'lucide-react';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

const TransactionSchema = Yup.object().shape({
  amount: Yup.number()
    .required('Le montant est requis')
    .min(0.01, 'Le montant doit être supérieur à 0'),
  description: Yup.string()
    .required('La description est requise')
    .min(3, 'La description doit contenir au moins 3 caractères'),
  date: Yup.date()
    .required('La date est requise')
    .max(new Date(), 'La date ne peut pas être dans le futur'),
  category: Yup.string()
    .required('La catégorie est requise'),
  account: Yup.string()
    .required('Le compte est requis'),
  type: Yup.string()
    .oneOf(['income', 'expense'], 'Type invalide')
    .required('Le type est requis'),
  tags: Yup.array()
    .of(Yup.string()),
  isRecurring: Yup.boolean(),
  recurringFrequency: Yup.string()
    .when('isRecurring', {
      is: true,
      then: (schema) => schema.required('La fréquence est requise')
    }),
  recurringEndDate: Yup.date()
    .when('isRecurring', {
      is: true,
      then: (schema) => schema.min(new Date(), 'La date de fin doit être dans le futur')
    }),
  location: Yup.object().shape({
    latitude: Yup.number(),
    longitude: Yup.number()
  }).nullable(),
  receipt: Yup.mixed().nullable(),
  notes: Yup.string(),
  status: Yup.string()
    .oneOf(['pending', 'cleared', 'reconciled'], 'Statut invalide')
    .required('Le statut est requis')
});

interface TransactionFormProps {
  initialValues?: any;
  onSubmit: (values: any) => Promise<void>;
  onCancel?: () => void;
  categories: Array<{ value: string; label: string }>;
  accounts: Array<{ value: string; label: string }>;
  onDirtyChange?: (dirty: boolean) => void;
}

const FormikDirtyListener: React.FC<{ onDirtyChange?: (dirty: boolean) => void }> = ({ onDirtyChange }) => {
  const { dirty } = useFormikContext();
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(dirty);
    }
  }, [dirty, onDirtyChange]);
  return null;
};

const TransactionForm: React.FC<TransactionFormProps> = ({
  initialValues = {
    amount: '',
    description: '',
    date: new Date(),
    category: '',
    account: '',
    type: 'expense',
    tags: [],
    isRecurring: false,
    recurringFrequency: '',
    recurringEndDate: null,
    location: null,
    receipt: null,
    notes: '',
    status: 'pending'
  },
  onSubmit,
  onCancel,
  categories,
  accounts,
  onDirtyChange
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'details'>('general');

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 5242880, // 5MB
    multiple: false
  });

  const handleGetLocation = (setFieldValue: any) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFieldValue('location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast.success('Localisation ajoutée avec succès');
        },
        () => {
          toast.error('Impossible d\'obtenir la localisation');
        }
      );
    } else {
      toast.error('Géolocalisation non supportée par votre navigateur');
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={TransactionSchema}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        try {
          await onSubmit(values);
          resetForm();
        } catch (error) {
          // Erreur gérée par le conteneur parent
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, errors, touched, isSubmitting, setFieldValue }) => (
        <Form className="space-y-5">
          <FormikDirtyListener onDirtyChange={onDirtyChange} />

          {/* Hero Amount Input Section */}
          <div className="flex flex-col items-center justify-center py-5 bg-primary/5 dark:bg-slate-900/40 rounded-2xl border border-primary/10 shadow-inner">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Montant</span>
            <div className="relative flex items-center justify-center w-full max-w-[240px]">
              <span className="absolute left-2 text-2xl font-black text-primary-light">€</span>
              <Field
                type="number"
                id="amount"
                name="amount"
                placeholder="0.00"
                className="w-full pl-8 pr-2 py-1 bg-transparent border-b border-primary/30 focus:border-primary text-center text-3xl font-extrabold text-foreground focus:outline-none transition-all duration-300"
                step="0.01"
              />
            </div>
            {errors.amount && touched.amount && (
              <p className="text-xs text-error font-semibold mt-1">{errors.amount as string}</p>
            )}
          </div>

          {/* Segmented control for Type */}
          <div className="grid grid-cols-2 gap-2 bg-surface dark:bg-slate-900/80 p-1 rounded-xl border border-border/40 dark:border-slate-800">
            <button
              type="button"
              className={cn(
                "flex items-center justify-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300",
                values.type === 'expense'
                  ? "bg-error text-white shadow-sm border border-error/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50 dark:hover:bg-slate-800/40"
              )}
              onClick={() => setFieldValue('type', 'expense')}
            >
              <TrendingDown size={14} className="mr-1.5" />
              Dépense
            </button>
            <button
              type="button"
              className={cn(
                "flex items-center justify-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300",
                values.type === 'income'
                  ? "bg-success text-white shadow-sm border border-success/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50 dark:hover:bg-slate-800/40"
              )}
              onClick={() => setFieldValue('type', 'income')}
            >
              <TrendingUp size={14} className="mr-1.5" />
              Revenu
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-surface dark:bg-slate-900/40 p-0.5 rounded-lg border border-border/40 dark:border-slate-800">
            <button
              type="button"
              className={cn(
                "flex-1 flex items-center justify-center space-x-1.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-200",
                activeTab === 'general'
                  ? "bg-background dark:bg-slate-800 text-primary border border-border/40 dark:border-slate-700 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab('general')}
            >
              <Receipt size={12} />
              <span>Général</span>
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 flex items-center justify-center space-x-1.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-200",
                activeTab === 'details'
                  ? "bg-background dark:bg-slate-800 text-primary border border-border/40 dark:border-slate-700 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab('details')}
            >
              <Sparkles size={12} />
              <span>Détails & Reçu</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[220px]">
            {activeTab === 'general' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                {/* Description */}
                <div className="sm:col-span-2">
                  <label htmlFor="description" className="label text-xs">Description</label>
                  <Field
                    type="text"
                    id="description"
                    name="description"
                    placeholder="Ex: Supermarché, Salaire..."
                    className="input py-2 text-sm"
                  />
                  {errors.description && touched.description && (
                    <p className="text-xs text-error mt-0.5">{errors.description as string}</p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label htmlFor="date" className="label text-xs">Date</label>
                  <div className="relative">
                    <DatePicker
                      selected={values.date}
                      onChange={(date) => setFieldValue('date', date)}
                      dateFormat="dd/MM/yyyy"
                      locale={fr}
                      className="input w-full py-2 text-sm"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4 pointer-events-none" />
                  </div>
                  {errors.date && touched.date && (
                    <p className="text-xs text-error mt-0.5">{errors.date as string}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="label text-xs">Statut</label>
                  <Field
                    as="select"
                    id="status"
                    name="status"
                    className="input py-2 text-sm"
                  >
                    <option value="pending">En attente (Planifié)</option>
                    <option value="cleared">Validé (Effectué)</option>
                    <option value="reconciled">Rapproché</option>
                  </Field>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="label text-xs">Catégorie</label>
                  <Select
                    id="category"
                    name="category"
                    options={categories}
                    value={categories.find(cat => cat.value === values.category)}
                    onChange={(option) => setFieldValue('category', option?.value)}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                    placeholder="Sélectionner..."
                  />
                  {errors.category && touched.category && (
                    <p className="text-xs text-error mt-0.5">{errors.category as string}</p>
                  )}
                </div>

                {/* Account */}
                <div>
                  <label htmlFor="account" className="label text-xs">Compte</label>
                  <Select
                    id="account"
                    name="account"
                    options={accounts}
                    value={accounts.find(acc => acc.value === values.account)}
                    onChange={(option) => setFieldValue('account', option?.value)}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                    placeholder="Sélectionner..."
                  />
                  {errors.account && touched.account && (
                    <p className="text-xs text-error mt-0.5">{errors.account as string}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                {/* Recurring */}
                <div className="sm:col-span-2 bg-surface/30 dark:bg-slate-900/20 p-3 rounded-xl border border-border/40 dark:border-slate-800">
                  <label className="label text-xs flex items-center space-x-2 mb-2 cursor-pointer">
                    <Field
                      type="checkbox"
                      name="isRecurring"
                      className="h-4 w-4 text-primary rounded border-border"
                    />
                    <Repeat className="h-3.5 w-3.5 text-primary" />
                    <span>Transaction récurrente automatique</span>
                  </label>

                  {values.isRecurring && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/30">
                      <div>
                        <label htmlFor="recurringFrequency" className="label text-[10px] uppercase font-bold text-muted-foreground">Fréquence</label>
                        <Field
                          as="select"
                          id="recurringFrequency"
                          name="recurringFrequency"
                          className="input py-1.5 text-xs"
                        >
                          <option value="">Choisir la fréquence...</option>
                          <option value="weekly">Hebdomadaire</option>
                          <option value="monthly">Mensuelle</option>
                          <option value="yearly">Annuelle</option>
                        </Field>
                        {errors.recurringFrequency && touched.recurringFrequency && (
                          <p className="text-xs text-error mt-0.5">{errors.recurringFrequency as string}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="recurringEndDate" className="label text-[10px] uppercase font-bold text-muted-foreground">Date de fin</label>
                        <div className="relative">
                          <DatePicker
                            selected={values.recurringEndDate}
                            onChange={(date) => setFieldValue('recurringEndDate', date)}
                            dateFormat="dd/MM/yyyy"
                            locale={fr}
                            placeholderText="Optionnel"
                            minDate={new Date()}
                            className="input w-full py-1.5 text-xs"
                          />
                          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted h-3.5 w-3.5 pointer-events-none" />
                        </div>
                        {errors.recurringEndDate && touched.recurringEndDate && (
                          <p className="text-xs text-error mt-0.5">{errors.recurringEndDate as string}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Receipt dropzone */}
                <div className="sm:col-span-2">
                  <label className="label text-xs flex items-center space-x-1.5 mb-1.5">
                    <Receipt className="h-3.5 w-3.5 text-primary" />
                    <span>Justificatif de paiement (Reçu)</span>
                  </label>
                  
                  {values.receipt ? (
                    <div className="flex items-center justify-between p-2.5 bg-success/5 dark:bg-success/15 border border-success/30 rounded-xl">
                      <div className="flex items-center space-x-2 min-w-0">
                        <Check className="h-4 w-4 text-success shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-foreground truncate">
                            {values.receipt instanceof File ? (values.receipt as File).name : 'Justificatif chargé'}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {values.receipt instanceof File ? `${Math.round((values.receipt as File).size / 1024)} KB` : 'Fichier image'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFieldValue('receipt', null)}
                        className="p-1 rounded-full hover:bg-error/10 text-muted hover:text-error transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      {...getRootProps()}
                      className="border border-dashed border-border/80 dark:border-slate-800 rounded-xl p-4 text-center hover:border-primary/50 transition-all duration-300 cursor-pointer bg-surface/30 dark:bg-slate-900/10 hover:bg-primary/5 group"
                    >
                      <input {...getInputProps()} />
                      <Upload className="h-6 w-6 text-muted group-hover:text-primary transition-colors mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-foreground">
                        Glissez le reçu ici ou cliquez pour charger
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        PNG ou JPG jusqu'à 5 Mo
                      </p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="label text-xs flex items-center space-x-1.5 mb-1.5">
                    <Tags className="h-3.5 w-3.5 text-primary" />
                    <span>Tags</span>
                  </label>
                  <Select
                    isMulti
                    name="tags"
                    options={[
                      { value: 'important', label: 'Important' },
                      { value: 'business', label: 'Professionnel' },
                      { value: 'personal', label: 'Personnel' }
                    ]}
                    value={values.tags.map((tag: string) => ({ value: tag, label: tag }))}
                    onChange={(options) => setFieldValue('tags', options.map(opt => opt.value))}
                    className="react-select-container text-xs"
                    classNamePrefix="react-select"
                    placeholder="Choisir..."
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="label text-xs flex items-center space-x-1.5 mb-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>Localisation</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-1.5 text-xs text-foreground"
                    onClick={() => handleGetLocation(setFieldValue)}
                  >
                    Ajouter ma position actuelle
                  </Button>
                  {values.location && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Lat: {values.location.latitude.toFixed(4)}, Long: {values.location.longitude.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="label text-xs">Notes & Commentaires</label>
                  <Field
                    as="textarea"
                    id="notes"
                    name="notes"
                    placeholder="Notes optionnelles sur la transaction..."
                    className="input min-h-[70px] py-1.5 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border/30 dark:border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelClick}
              className="py-1.5 text-xs text-foreground"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark"
            >
              Enregistrer la transaction
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default TransactionForm;