import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { fr } from 'date-fns/locale';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const GoalSchema = Yup.object().shape({
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

const NewGoalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, createGoal } = useAuth();

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Nouvel objectif d'épargne
        </h1>

        <Formik
          initialValues={{
            name: '',
            targetAmount: 0,
            initialAmount: 0,
            targetDate: new Date(),
            automaticSaving: false,
            savingFrequency: '',
            savingAmount: 0,
            notes: ''
          }}
          validationSchema={GoalSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              if (!user) {
                toast.error('Vous devez être connecté');
                return;
              }

              const goalData = {
                name: values.name,
                target_amount: values.targetAmount,
                current_amount: values.initialAmount || 0,
                deadline: values.targetDate.toISOString(),
                auto_save: values.automaticSaving,
                auto_save_frequency: values.savingFrequency || null,
                auto_save_amount: values.savingAmount || 0,
                notes: values.notes,
                user: user.id
              };

              await createGoal(goalData);
              toast.success('Objectif créé avec succès');
              navigate('/goals');
            } catch (error) {
              console.error('Error creating goal:', error);
              toast.error('Erreur lors de la création de l\'objectif');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, setFieldValue, isSubmitting }) => (
            <Form className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations de l'objectif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="label">Nom de l'objectif</label>
                      <Field
                        type="text"
                        id="name"
                        name="name"
                        className="input"
                        placeholder="Ex: Vacances d'été"
                      />
                      {errors.name && touched.name && (
                        <p className="text-sm text-error mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="targetAmount" className="label">Montant cible</label>
                      <Field
                        type="number"
                        id="targetAmount"
                        name="targetAmount"
                        className="input"
                        step="0.01"
                      />
                      {errors.targetAmount && touched.targetAmount && (
                        <p className="text-sm text-error mt-1">{errors.targetAmount}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="initialAmount" className="label">Montant initial</label>
                      <Field
                        type="number"
                        id="initialAmount"
                        name="initialAmount"
                        className="input"
                        step="0.01"
                      />
                      {errors.initialAmount && touched.initialAmount && (
                        <p className="text-sm text-error mt-1">{errors.initialAmount}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="targetDate" className="label">Date cible</label>
                      <div className="relative">
                        <DatePicker
                          selected={values.targetDate}
                          onChange={(date) => setFieldValue('targetDate', date)}
                          dateFormat="dd/MM/yyyy"
                          locale={fr}
                          className="input w-full"
                          minDate={new Date()}
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4" />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2">
                        <Field
                          type="checkbox"
                          name="automaticSaving"
                          className="h-4 w-4 text-primary rounded border-border"
                        />
                        <span className="text-sm text-foreground">Épargne automatique</span>
                      </label>
                    </div>

                    {values.automaticSaving && (
                      <>
                        <div>
                          <label htmlFor="savingFrequency" className="label">Fréquence d'épargne</label>
                          <Field
                            as="select"
                            id="savingFrequency"
                            name="savingFrequency"
                            className="input"
                          >
                            <option value="">Sélectionner une fréquence</option>
                            <option value="weekly">Hebdomadaire</option>
                            <option value="monthly">Mensuelle</option>
                          </Field>
                          {errors.savingFrequency && touched.savingFrequency && (
                            <p className="text-sm text-error mt-1">{errors.savingFrequency}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="savingAmount" className="label">Montant à épargner</label>
                          <Field
                            type="number"
                            id="savingAmount"
                            name="savingAmount"
                            className="input"
                            step="0.01"
                          />
                          {errors.savingAmount && touched.savingAmount && (
                            <p className="text-sm text-error mt-1">{errors.savingAmount}</p>
                          )}
                        </div>
                      </>
                    )}

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
                  onClick={() => navigate('/goals')}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Créer l'objectif
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default NewGoalPage;