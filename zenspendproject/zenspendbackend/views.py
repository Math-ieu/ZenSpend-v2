from django.shortcuts import render

from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.hashers import make_password
from .models import *
from .serializers import *
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
User = get_user_model()


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as e:
            # Log l'erreur pour débogage
            logger.error(f"Erreur de validation: {e.detail}")
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            try:
                user = serializer.save()
                return Response({
                    'status': 'success',
                    'status_code': 201,
                    'message': 'Utilisateur créé avec succès',
                    'data': {
                        'user': {
                            'id': user.id,
                            'email': user.email,
                            'first_name': user.first_name,
                            'last_name': user.last_name,
                            'phone_number': user.phone_number,
                            'preferred_currency': user.preferred_currency,
                        }
                    }
                }, 
                status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'status': 'error',
                    'status_code': 500,
                    'message': 'Erreur lors de la création de l\'utilisateur',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Formater les erreurs de validation
            formatted_errors = {}
            for field, errors in serializer.errors.items():
                formatted_errors[field] = errors if isinstance(errors, list) else [str(errors)]
            
            return Response({
                'status': 'error',
                'status_code': 400,
                'message': 'Données invalides',
                'errors': formatted_errors
            }, status=status.HTTP_400_BAD_REQUEST)



class UserLogoutView(APIView): 
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response({'message': 'Déconnexion réussie'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Token de rafraîchissement requis'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Token invalide'}, status=status.HTTP_400_BAD_REQUEST)