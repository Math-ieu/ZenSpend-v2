import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { fr } from 'date-fns/locale';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { categories } from '../../lib/mockData';
import toast from 'react-hot-toast';

const BudgetSchema = Yup.object().shape({
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
    .min(0, 'Le seuil doit être positif')
    .max(100, 'Le seuil doit être inférieur à 100')
    .required('Le seuil d\'alerte est requis')
});

const NewBudgetPage: React.FC = () => {
  const navigate = useNavigate();

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name
  }));

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Nouveau budget
        </h1>

        <Formik
          initialValues={{
            name: '',
            amount: '',
            startDate: new Date(),
            endDate: new Date(),
            category: '',
            alertThreshold: 80,
            isRecurring: false
          }}
          validationSchema={BudgetSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              // Here you would normally make an API call
              console.log('New budget:', values);
              toast.success('Budget créé avec succès');
              navigate('/budgets');
            } catch (error) {
              toast.error('Erreur lors de la création du budget');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, setFieldValue, isSubmitting }) => (
            <Form className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations du budget</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="label">Nom du budget</label>
                      <Field
                        type="text"
                        id="name"
                        name="name"
                        className="input"
                        placeholder="Ex: Courses alimentaires"
                      />
                      {errors.name && touched.name && (
                        <p className="text-sm text-error mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="amount" className="label">Montant</label>
                      <Field
                        type="number"
                        id="amount"
                        name="amount"
                        className="input"
                        step="0.01"
                      />
                      {errors.amount && touched.amount && (
                        <p className="text-sm text-error mt-1">{errors.amount}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="category" className="label">Catégorie</label>
                      <Select
                        id="category"
                        name="category"
                        options={categoryOptions}
                        value={categoryOptions.find(cat => cat.value === values.category)}
                        onChange={(option) => setFieldValue('category', option?.value)}
                        className="react-select"
                        classNamePrefix="react-select"
                      />
                      {errors.category && touched.category && (
                        <p className="text-sm text-error mt-1">{errors.category}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="alertThreshold" className="label">Seuil d'alerte (%)</label>
                      <Field
                        type="number"
                        id="alertThreshold"
                        name="alertThreshold"
                        className="input"
                        min="0"
                        max="100"
                      />
                      {errors.alertThreshold && touched.alertThreshold && (
                        <p className="text-sm text-error mt-1">{errors.alertThreshold}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="startDate" className="label">Date de début</label>
                      <div className="relative">
                        <DatePicker
                          selected={values.startDate}
                          onChange={(date) => setFieldValue('startDate', date)}
                          dateFormat="dd/MM/yyyy"
                          locale={fr}
                          className="input w-full"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="endDate" className="label">Date de fin</label>
                      <div className="relative">
                        <DatePicker
                          selected={values.endDate}
                          onChange={(date) => setFieldValue('endDate', date)}
                          dateFormat="dd/MM/yyyy"
                          locale={fr}
                          className="input w-full"
                          minDate={values.startDate}
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4" />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2">
                        <Field
                          type="checkbox"
                          name="isRecurring"
                          className="h-4 w-4 text-primary rounded border-border"
                        />
                        <span className="text-sm text-foreground">Budget récurrent</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/budgets')}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Créer le budget
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default NewBudgetPage;