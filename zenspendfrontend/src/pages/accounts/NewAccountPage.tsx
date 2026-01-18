import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const AccountSchema = Yup.object().shape({
  name: Yup.string()
    .required('Le nom est requis')
    .min(3, 'Le nom doit contenir au moins 3 caractères'),
  type: Yup.string()
    .required('Le type est requis')
    .oneOf(['checking', 'savings', 'credit', 'investment'], 'Type invalide'),
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

const NewAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, createAccount } = useAuth();

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Nouveau compte
        </h1>

        <Formik
          initialValues={{
            name: '',
            type: 'checking',
            balance: 0,
            currency: 'EUR',
            accountNumber: '',
            institution: ''
          }}
          validationSchema={AccountSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              if (!user) {
                toast.error('Vous devez être connecté');
                return;
              }

              const accountData = {
                name: values.name,
                account_type: values.type,
                balance: values.balance,
                currency: values.currency,
                account_number: values.accountNumber,
                institution: values.institution,
                user: user.id
              };

              await createAccount(accountData);
              toast.success('Compte créé avec succès');
              navigate('/accounts');
            } catch (error) {
              console.error('Error creating account:', error);
              toast.error('Erreur lors de la création du compte');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations du compte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="label">Nom du compte</label>
                      <Field
                        type="text"
                        id="name"
                        name="name"
                        className="input"
                        placeholder="Ex: Compte Courant Principal"
                      />
                      {errors.name && touched.name && (
                        <p className="text-sm text-error mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="type" className="label">Type de compte</label>
                      <Field
                        as="select"
                        id="type"
                        name="type"
                        className="input"
                      >
                        <option value="checking">Compte courant</option>
                        <option value="savings">Compte d'épargne</option>
                        <option value="credit">Carte de crédit</option>
                        <option value="investment">Compte d'investissement</option>
                      </Field>
                      {errors.type && touched.type && (
                        <p className="text-sm text-error mt-1">{errors.type}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="balance" className="label">Solde initial</label>
                      <Field
                        type="number"
                        id="balance"
                        name="balance"
                        className="input"
                        step="0.01"
                      />
                      {errors.balance && touched.balance && (
                        <p className="text-sm text-error mt-1">{errors.balance}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="currency" className="label">Devise</label>
                      <Field
                        as="select"
                        id="currency"
                        name="currency"
                        className="input"
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                      </Field>
                      {errors.currency && touched.currency && (
                        <p className="text-sm text-error mt-1">{errors.currency}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="accountNumber" className="label">Numéro de compte</label>
                      <Field
                        type="text"
                        id="accountNumber"
                        name="accountNumber"
                        className="input"
                        placeholder="FR76 XXXX XXXX XXXX XXXX"
                      />
                      {errors.accountNumber && touched.accountNumber && (
                        <p className="text-sm text-error mt-1">{errors.accountNumber}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="institution" className="label">Institution financière</label>
                      <Field
                        type="text"
                        id="institution"
                        name="institution"
                        className="input"
                        placeholder="Ex: BNP Paribas"
                      />
                      {errors.institution && touched.institution && (
                        <p className="text-sm text-error mt-1">{errors.institution}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/accounts')}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Créer le compte
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default NewAccountPage;