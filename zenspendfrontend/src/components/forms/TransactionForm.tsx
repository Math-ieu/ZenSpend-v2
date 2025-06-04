import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useDropzone } from 'react-dropzone';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { fr } from 'date-fns/locale';
import { Calendar, Upload, MapPin, RepeatIcon, Tags, Receipt } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import toast from 'react-hot-toast';

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
  }),
  receipt: Yup.mixed(),
  notes: Yup.string(),
  status: Yup.string()
    .oneOf(['pending', 'cleared', 'reconciled'], 'Statut invalide')
    .required('Le statut est requis')
});

interface TransactionFormProps {
  initialValues?: any;
  onSubmit: (values: any) => Promise<void>;
  categories: Array<{ value: string; label: string }>;
  accounts: Array<{ value: string; label: string }>;
}

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
  categories,
  accounts
}) => {
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
          toast.success('Localisation ajoutée');
        },
        () => {
          toast.error('Impossible d\'obtenir la localisation');
        }
      );
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={TransactionSchema}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        try {
          await onSubmit(values);
          toast.success('Transaction enregistrée avec succès');
          resetForm();
        } catch (error) {
          toast.error('Erreur lors de l\'enregistrement de la transaction');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, errors, touched, isSubmitting, setFieldValue }) => (
        <Form className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-y-auto max-h-[400px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="amount" className="label">Montant</label>
                    <Field
                      type="number"
                      id="amount"
                      name="amount"
                      className="input"
                      step="0.01"
                    />
                    {typeof errors.amount === 'string' && touched.amount && (
                      <p className="text-sm text-error mt-1">{errors.amount}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="type" className="label">Type</label>
                    <Field
                      as="select"
                      id="type"
                      name="type"
                      className="input"
                    >
                      <option value="expense">Dépense</option>
                      <option value="income">Revenu</option>
                    </Field>
                  </div>

                  <div>
                    <label htmlFor="description" className="label">Description</label>
                    <Field
                      type="text"
                      id="description"
                      name="description"
                      className="input"
                    />
                    {typeof errors.description === 'string' && touched.description && (
                      <p className="text-sm text-error mt-1">{errors.description}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="date" className="label">Date</label>
                    <div className="relative">
                      <DatePicker
                        selected={values.date}
                        onChange={(date) => setFieldValue('date', date)}
                        dateFormat="dd/MM/yyyy"
                        locale={fr}
                        className="input w-full"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="category" className="label">Catégorie</label>
                    <Select
                      id="category"
                      name="category"
                      options={categories}
                      value={categories.find(cat => cat.value === values.category)}
                      onChange={(option) => setFieldValue('category', option?.value)}
                      className="react-select"
                      classNamePrefix="react-select"
                    />
                    {typeof errors.category === 'string' && touched.category && (
                      <p className="text-sm text-error mt-1">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="account" className="label">Compte</label>
                    <Select
                      id="account"
                      name="account"
                      options={accounts}
                      value={accounts.find(acc => acc.value === values.account)}
                      onChange={(option) => setFieldValue('account', option?.value)}
                      className="react-select"
                      classNamePrefix="react-select"
                    />
                    {typeof errors.account === 'string' && touched.account && (
                      <p className="text-sm text-error mt-1">{errors.account}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détails additionnels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center space-x-2">
                    <Field
                      type="checkbox"
                      name="isRecurring"
                      className="h-4 w-4 text-primary rounded border-border"
                    />
                    <span>Transaction récurrente</span>
                    <RepeatIcon className="h-4 w-4 text-muted" />
                  </label>

                  {values.isRecurring && (
                    <div className="mt-2 space-y-2">
                      <Field
                        as="select"
                        name="recurringFrequency"
                        className="input"
                      >
                        <option value="">Sélectionner une fréquence</option>
                        <option value="weekly">Hebdomadaire</option>
                        <option value="monthly">Mensuelle</option>
                        <option value="yearly">Annuelle</option>
                      </Field>

                      <div className="relative">
                        <DatePicker
                          selected={values.recurringEndDate}
                          onChange={(date) => setFieldValue('recurringEndDate', date)}
                          dateFormat="dd/MM/yyyy"
                          locale={fr}
                          placeholderText="Date de fin"
                          className="input w-full"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label flex items-center space-x-2">
                    <Tags className="h-4 w-4 text-muted" />
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
                    className="react-select"
                    classNamePrefix="react-select"
                  />
                </div>

                <div>
                  <label className="label flex items-center space-x-2">
                    <Receipt className="h-4 w-4 text-muted" />
                    <span>Reçu</span>
                  </label>
                  <div
                    {...getRootProps()}
                    className="border-2 border-dashed border-border rounded-md p-4 text-center hover:border-primary transition-colors cursor-pointer"
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-8 w-8 text-muted mx-auto mb-2" />
                    <p className="text-sm text-muted">
                      Glissez-déposez un fichier ici ou cliquez pour sélectionner
                    </p>
                    <p className="text-xs text-muted mt-1">
                      PNG, JPG jusqu'à 5MB
                    </p>
                  </div>
                </div>

                <div>
                  <label className="label flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted" />
                    <span>Localisation</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleGetLocation(setFieldValue)}
                  >
                    Ajouter la localisation actuelle
                  </Button>
                  {values.location && (
                    <p className="text-xs text-muted mt-1">
                      Lat: {values.location.latitude}, Long: {values.location.longitude}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="notes" className="label">Notes</label>
                  <Field
                    as="textarea"
                    id="notes"
                    name="notes"
                    className="input min-h-[100px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
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