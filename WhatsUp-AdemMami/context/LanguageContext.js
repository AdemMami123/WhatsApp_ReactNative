import React, { createContext, useState, useEffect, useContext } from 'react';
import firebase from '../Config';
import en from '../translations/en';
import fr from '../translations/fr';
import ar from '../translations/ar';

// Create the language context
const LanguageContext = createContext();

// Available languages
export const languages = {
  en: { code: 'en', name: 'English', translations: en, direction: 'ltr', icon: 'flag-usa' },
  fr: { code: 'fr', name: 'Français', translations: fr, direction: 'ltr', icon: 'flag-france' },
  ar: { code: 'ar', name: 'العربية', translations: ar, direction: 'rtl', icon: 'flag-saudi-arabia' }
};

// Default language
const DEFAULT_LANGUAGE = 'en';

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(languages[DEFAULT_LANGUAGE]);
  const [isLoading, setIsLoading] = useState(true);

  // Load the user's language preference from Firebase
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          const database = firebase.database();
          const userRef = database.ref('ListComptes').child(currentUser.uid);
          
          const snapshot = await userRef.once('value');
          const userData = snapshot.val();
          
          if (userData && userData.language && languages[userData.language]) {
            setCurrentLanguage(languages[userData.language]);
          }
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguagePreference();
  }, []);

  // Change the language and save the preference to Firebase
  const changeLanguage = async (languageCode) => {
    if (languages[languageCode]) {
      setCurrentLanguage(languages[languageCode]);
      
      try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          const database = firebase.database();
          const userRef = database.ref('ListComptes').child(currentUser.uid);
          
          await userRef.update({
            language: languageCode
          });
        }
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  };

  // Translate a key
  const t = (key) => {
    return currentLanguage.translations[key] || key;
  };

  return (
    <LanguageContext.Provider 
      value={{ 
        currentLanguage, 
        changeLanguage, 
        t,
        isLoading,
        languages
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
