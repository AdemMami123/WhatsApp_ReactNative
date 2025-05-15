import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, RadioButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage, languages } from '../context/LanguageContext';

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage, t } = useLanguage();

  const handleLanguageChange = (languageCode) => {
    if (languageCode !== currentLanguage.code) {
      changeLanguage(languageCode);
      Alert.alert(
        t('success'),
        t('languageChanged'),
        [{ text: t('ok') }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="translate" size={22} color="#128C7E" style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>{t('languageSettings')}</Text>
      </View>
      
      <Text style={styles.subtitle}>{t('selectLanguage')}</Text>
      
      <View style={styles.languageOptions}>
        {/* English Option */}
        <TouchableOpacity 
          style={[
            styles.languageOption, 
            currentLanguage.code === 'en' && styles.selectedLanguage
          ]}
          onPress={() => handleLanguageChange('en')}
        >
          <View style={styles.languageContent}>
            <MaterialCommunityIcons name="flag-usa" size={24} color="#128C7E" style={styles.flagIcon} />
            <Text style={styles.languageName}>{t('english')}</Text>
          </View>
          <RadioButton
            value="en"
            status={currentLanguage.code === 'en' ? 'checked' : 'unchecked'}
            onPress={() => handleLanguageChange('en')}
            color="#128C7E"
          />
        </TouchableOpacity>
        
        {/* French Option */}
        <TouchableOpacity 
          style={[
            styles.languageOption, 
            currentLanguage.code === 'fr' && styles.selectedLanguage
          ]}
          onPress={() => handleLanguageChange('fr')}
        >
          <View style={styles.languageContent}>
            <MaterialCommunityIcons name="flag-france" size={24} color="#128C7E" style={styles.flagIcon} />
            <Text style={styles.languageName}>{t('french')}</Text>
          </View>
          <RadioButton
            value="fr"
            status={currentLanguage.code === 'fr' ? 'checked' : 'unchecked'}
            onPress={() => handleLanguageChange('fr')}
            color="#128C7E"
          />
        </TouchableOpacity>
        
        {/* Arabic Option */}
        <TouchableOpacity 
          style={[
            styles.languageOption, 
            currentLanguage.code === 'ar' && styles.selectedLanguage
          ]}
          onPress={() => handleLanguageChange('ar')}
        >
          <View style={styles.languageContent}>
            <MaterialCommunityIcons name="flag-saudi-arabia" size={24} color="#128C7E" style={styles.flagIcon} />
            <Text style={styles.languageName}>{t('arabic')}</Text>
          </View>
          <RadioButton
            value="ar"
            status={currentLanguage.code === 'ar' ? 'checked' : 'unchecked'}
            onPress={() => handleLanguageChange('ar')}
            color="#128C7E"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 10,
  },
  languageOptions: {
    marginTop: 10,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedLanguage: {
    backgroundColor: '#e7f3f0',
    borderColor: '#128C7E',
    borderWidth: 1,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagIcon: {
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: '#333',
  },
});

export default LanguageSelector;
