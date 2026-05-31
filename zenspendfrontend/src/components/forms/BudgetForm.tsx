import React, { useEffect } from 'react';
import { Formik, Form, Field, useFormikContext } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { fr } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import Button from '../ui/Button';
import { formatCurrency } from '../../lib/utils';


export const BudgetSchema = Yup.object().shape({
  name: Yup.string()
    .required('Le nom est requis')
    .min(3, 'Le nom doit contenir au moins 3 caractères'),
  amount: Yup.number()
    .required('Le montant est requis')
    .min(0, 'Le montant doit être positif'),
  startDate: Yup.date()
    .required('La date de début est requise'),
  endDate: Yup.date()
    .required('La date de fin est requise')
    .min(Yup.ref('startDate'), 'La date de fin doit être après la date de début'),
  category: Yup.string()
    .required('La catégorie est requise'),
  alertThreshold: Yup.number()
    .min(0)
    .max(100)
    .required('Le seuil d\'alerte est requis')
});

interface BudgetFormProps {
  initialValues?: any;
  onSubmit: (values: any, formikBag: any) => Promise<void>;
  onCancel: () => void;
  categoryOptions: Array<{ value: string; label: string }>;
  onDirtyChange?: (dirty: boolean) => void;
  historicalAverages?: Record<string, number>;
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

const BudgetForm: React.FC<BudgetFormProps> = ({
  initialValues = {
    name: '',
    amount: 0,
    startDate: new Date(),
    endDate: new Date(),
    category: '',
    alertThreshold: 80,
    isRecurring: false
  },
  onSubmit,
  onCancel,
  categoryOptions,
  onDirtyChange,
  historicalAverages
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={BudgetSchema}
      onSubmit={onSubmit}
    >
      {({ values, errors, touched, setFieldValue, isSubmitting }) => (
        <Form className="space-y-4">
          <FormikDirtyListener onDirtyChange={onDirtyChange} />
          <div>
            <label htmlFor="name" className="label text-xs">Nom du budget</label>
            <Field type="text" id="name" name="name" className="input py-2 text-sm" placeholder="Ex: Courses alimentaires" />
            {errors.name && touched.name && <p className="text-xs text-error mt-0.5">{errors.name as string}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="label text-xs">Montant</label>
              <Field type="number" id="amount" name="amount" className="input py-2 text-sm" step="0.01" />
              {errors.amount && touched.amount && <p className="text-xs text-error mt-0.5">{errors.amount as string}</p>}
              {values.category && historicalAverages && historicalAverages[values.category] !== undefined && (
                <p className="text-[11px] text-primary/80 mt-1 italic leading-tight">
                  Moyenne {values.category} le mois dernier : <span className="font-semibold">{formatCurrency(historicalAverages[values.category])}</span>
                </p>
              )}
            </div>
            <div>
              <label htmlFor="category" className="label text-xs">Catégorie</label>
              <Select
                id="category"
                name="category"
                options={categoryOptions}
                value={categoryOptions.find(cat => cat.value === values.category)}
                onChange={(option) => setFieldValue('category', option?.value)}
                className="react-select text-sm"
                classNamePrefix="react-select"
              />
              {errors.category && touched.category && <p className="text-xs text-error mt-0.5">{errors.category as string}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="label text-xs">Date de début</label>
              <div className="relative">
                <DatePicker
                  selected={values.startDate}
                  onChange={(date) => setFieldValue('startDate', date)}
                  dateFormat="dd/MM/yyyy"
                  locale={fr}
                  className="input w-full py-2 text-sm"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4" />
              </div>
            </div>
            <div>
              <label htmlFor="endDate" className="label text-xs">Date de fin</label>
              <div className="relative">
                <DatePicker
                  selected={values.endDate}
                  onChange={(date) => setFieldValue('endDate', date)}
                  dateFormat="dd/MM/yyyy"
                  locale={fr}
                  className="input w-full py-2 text-sm"
                  minDate={values.startDate}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="alertThreshold" className="label text-xs">Seuil d'alerte (%)</label>
              <Field type="number" id="alertThreshold" name="alertThreshold" className="input py-2 text-sm" min="0" max="100" />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center space-x-2">
                <Field type="checkbox" name="isRecurring" className="h-4 w-4 text-primary rounded border-border" />
                <span className="text-xs text-foreground">Budget récurrent</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-border/30">
            <Button type="button" variant="outline" onClick={onCancel} className="py-1.5 text-xs text-foreground">Annuler</Button>
            <Button type="submit" isLoading={isSubmitting} className="py-1.5 text-xs">Créer le budget</Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default BudgetForm;
