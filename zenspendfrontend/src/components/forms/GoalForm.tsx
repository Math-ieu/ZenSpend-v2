import React, { useEffect } from 'react';
import { Formik, Form, Field, useFormikContext } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import { fr } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import Button from '../ui/Button';

export const GoalSchema = Yup.object().shape({
  name: Yup.string()
    .required('Le nom est requis')
    .min(3, 'Le nom doit contenir au moins 3 caractères'),
  targetAmount: Yup.number()
    .required('Le montant cible est requis')
    .min(0, 'Le montant doit être positif'),
  initialAmount: Yup.number()
    .min(0, 'Le montant doit être positif'),
  targetDate: Yup.date()
    .required('La date cible est requise')
    .min(new Date(), 'La date cible doit être dans le futur'),
  automaticSaving: Yup.boolean(),
  savingFrequency: Yup.string()
    .when('automaticSaving', {
      is: true,
      then: (schema) => schema.required('La fréquence est requise')
    }),
  savingAmount: Yup.number()
    .when('automaticSaving', {
      is: true,
      then: (schema) => schema.required('Le montant est requis').min(0, 'Le montant doit être positif')
    })
});

interface GoalFormProps {
  initialValues?: any;
  onSubmit: (values: any, formikBag: any) => Promise<void>;
  onCancel: () => void;
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

const GoalForm: React.FC<GoalFormProps> = ({
  initialValues = {
    name: '',
    targetAmount: 0,
    initialAmount: 0,
    targetDate: new Date(),
    automaticSaving: false,
    savingFrequency: '',
    savingAmount: 0,
    notes: ''
  },
  onSubmit,
  onCancel,
  onDirtyChange
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={GoalSchema}
      onSubmit={onSubmit}
    >
      {({ values, errors, touched, setFieldValue, isSubmitting }) => (
        <Form className="space-y-4">
          <FormikDirtyListener onDirtyChange={onDirtyChange} />
          <div>
            <label htmlFor="name" className="label text-xs">Nom de l'objectif</label>
            <Field type="text" id="name" name="name" className="input py-2 text-sm" placeholder="Ex: Vacances d'été" />
            {errors.name && touched.name && <p className="text-xs text-error mt-0.5">{errors.name as string}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="targetAmount" className="label text-xs">Montant cible</label>
              <Field type="number" id="targetAmount" name="targetAmount" className="input py-2 text-sm" step="0.01" />
              {errors.targetAmount && touched.targetAmount && <p className="text-xs text-error mt-0.5">{errors.targetAmount as string}</p>}
            </div>
            <div>
              <label htmlFor="initialAmount" className="label text-xs">Montant initial</label>
              <Field type="number" id="initialAmount" name="initialAmount" className="input py-2 text-sm" step="0.01" />
            </div>
          </div>
          <div>
            <label htmlFor="targetDate" className="label text-xs">Date cible</label>
            <div className="relative">
              <DatePicker
                selected={values.targetDate}
                onChange={(date) => setFieldValue('targetDate', date)}
                dateFormat="dd/MM/yyyy"
                locale={fr}
                className="input w-full py-2 text-sm"
                minDate={new Date()}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4" />
            </div>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <Field type="checkbox" name="automaticSaving" className="h-4 w-4 text-primary rounded border-border" />
              <span className="text-xs text-foreground">Épargne automatique</span>
            </label>
          </div>
          {values.automaticSaving && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="savingFrequency" className="label text-xs">Fréquence d'épargne</label>
                <Field as="select" id="savingFrequency" name="savingFrequency" className="input py-2 text-sm">
                  <option value="">Sélectionner</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuelle</option>
                </Field>
              </div>
              <div>
                <label htmlFor="savingAmount" className="label text-xs">Montant à épargner</label>
                <Field type="number" id="savingAmount" name="savingAmount" className="input py-2 text-sm" step="0.01" />
              </div>
            </div>
          )}
          <div>
            <label htmlFor="notes" className="label text-xs">Notes</label>
            <Field as="textarea" id="notes" name="notes" className="input min-h-[60px] py-2 text-sm" />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-border/30">
            <Button type="button" variant="outline" onClick={onCancel} className="py-1.5 text-xs text-foreground">Annuler</Button>
            <Button type="submit" isLoading={isSubmitting} className="py-1.5 text-xs">Créer l'objectif</Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default GoalForm;
