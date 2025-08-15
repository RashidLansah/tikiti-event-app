import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';

const CategoryDropdown = ({ 
  selectedCategory, 
  onSelectCategory, 
  categories, 
  placeholder = "Select a category" 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  const handleSelect = (category) => {
    onSelectCategory(category.id);
    setIsOpen(false);
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.categoryItemContent}>
        <Feather 
          name={item.icon} 
          size={20} 
          color={selectedCategory === item.id ? Colors.white : Colors.text.secondary} 
        />
        <Text style={[
          styles.categoryItemText,
          selectedCategory === item.id && styles.selectedCategoryItemText
        ]}>
          {item.name}
        </Text>
      </View>
      {selectedCategory === item.id && (
        <Feather name="check" size={16} color={Colors.white} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsOpen(true)}
      >
        <View style={styles.dropdownButtonContent}>
          {selectedCategoryData ? (
            <>
              <Feather 
                name={selectedCategoryData.icon} 
                size={18} 
                color={Colors.text.primary} 
              />
              <Text style={styles.dropdownButtonText}>
                {selectedCategoryData.name}
              </Text>
            </>
          ) : (
            <>
              <Feather name="tag" size={18} color={Colors.text.tertiary} />
              <Text style={styles.placeholderText}>{placeholder}</Text>
            </>
          )}
        </View>
        <Feather 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={Colors.text.tertiary} 
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Feather name="x" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.categoryList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  dropdownButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginLeft: Spacing[3],
    fontWeight: Typography.fontWeight.medium,
  },
  placeholderText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    marginLeft: Spacing[3],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    width: '90%',
    maxHeight: '70%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  categoryList: {
    paddingHorizontal: Spacing[4],
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing[1],
  },
  selectedCategoryItem: {
    backgroundColor: Colors.primary[500],
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryItemText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginLeft: Spacing[3],
    fontWeight: Typography.fontWeight.medium,
  },
  selectedCategoryItemText: {
    color: Colors.white,
  },
});

export default CategoryDropdown; 