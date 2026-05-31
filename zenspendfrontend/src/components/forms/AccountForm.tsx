import React, { useEffect } from 'react';
import { Formik, Form, Field, useFormikContext } from 'formik';
import * as Yup from 'yup';
import Button from '../ui/Button';

export const AccountSchema = Yup.object().shape({
  name: Yup.string()
    .required('Le nom est requis')
    .min(3, 'Le nom doit contenir au moins 3 caractères'),
  type: Yup.string()
    .required('Le type est requis'),
  balance: Yup.number()
    .required('Le solde initial est requis'),
  currency: Yup.string()
    .required('La devise est requise'),
  accountNumber: Yup.string()
    .required('Le numéro de compte est requis')
    .min(10, 'Le numéro de compte doit contenir au moins 10 caractères'),
  institution: Yup.string()
    .required('L\'institution financière est requise')
});

interface AccountFormProps {
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

const AccountForm: React.FC<AccountFormProps> = ({
  initialValues = {
    name: '',
    type: 'checking',
    balance: 0,
    currency: 'EUR',
    accountNumber: '',
    institution: ''
  },
  onSubmit,
  onCancel,
  onDirtyChange
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={AccountSchema}
      onSubmit={onSubmit}
    >
      {({ errors, touched, isSubmitting }) => (
        <Form className="space-y-4">
          <FormikDirtyListener onDirtyChange={onDirtyChange} />
          <div>
            <label htmlFor="name" className="label text-xs">Nom du compte</label>
            <Field type="text" id="name" name="name" className="input py-2 text-sm" placeholder="Ex: Compte Courant Principal" />
            {errors.name && touched.name && <p className="text-xs text-error mt-0.5">{errors.name as string}</p>}
          </div>
          <div>
            <label htmlFor="type" className="label text-xs">Type de compte</label>
            <Field as="select" id="type" name="type" className="input py-2 text-sm">
              <option value="checking">Compte courant</option>
              <option value="savings">Compte d'épargne</option>
              <option value="credit">Carte de crédit</option>
              <option value="investment">Compte d'investissement</option>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="balance" className="label text-xs">Solde initial</label>
              <Field type="number" id="balance" name="balance" className="input py-2 text-sm" step="0.01" />
            </div>
            <div>
              <label htmlFor="currency" className="label text-xs">Devise</label>
              <Field as="select" id="currency" name="currency" className="input py-2 text-sm">
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </Field>
            </div>
          </div>
          <div>
            <label htmlFor="accountNumber" className="label text-xs">Numéro de compte</label>
            <Field type="text" id="accountNumber" name="accountNumber" className="input py-2 text-sm" placeholder="FR76 XXXX XXXX XXXX" />
            {errors.accountNumber && touched.accountNumber && <p className="text-xs text-error mt-0.5">{errors.accountNumber as string}</p>}
          </div>
          <div>
            <label htmlFor="institution" className="label text-xs">Institution financière</label>
            <Field type="text" id="institution" name="institution" className="input py-2 text-sm" placeholder="Ex: BNP Paribas" />
            {errors.institution && touched.institution && <p className="text-xs text-error mt-0.5">{errors.institution as string}</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-border/30">
            <Button type="button" variant="outline" onClick={onCancel} className="py-1.5 text-xs text-foreground">Annuler</Button>
            <Button type="submit" isLoading={isSubmitting} className="py-1.5 text-xs">Créer le compte</Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default AccountForm;
