import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native-web';
import { MaterialCommunityIcons } from '@/components/ui/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useCartStore } from '@/stores/useCartStore';
import { SearchInput } from '@/components/ui/Input';
import { ProductCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Loading';
import { Product } from '@/mock/data';

export const MenuScreen: React.FC = () => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];
  const { width: screenWidth } = useWindowDimensions();

  // Dynamic grid column calculation: 3 -> 4 -> 5 -> 6 columns
  const numColumns = screenWidth < 1024 ? 3 : screenWidth < 1366 ? 4 : screenWidth < 1600 ? 5 : 6;

  const itemWidth = `${100 / numColumns}%` as any;

  // Menu store state
  const {
    categories,
    selectedCategoryId,
    searchQuery,
    selectCategory,
    setSearchQuery,
    getFilteredProducts,
  } = useMenuStore();

  // Cart store state
  const { addToCart, selectedTableName } = useCartStore();

  const filteredProducts = getFilteredProducts();

  const handleProductPress = (product: Product) => {
    addToCart(product, 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search and Category Filter Section */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchCol}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search items by name or code..."
          />
        </View>

        {selectedTableName && (
          <View style={[styles.tableTag, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="table-chair" size={16} color={colors.primary} />
            <Text style={[styles.tableTagText, { color: colors.primary }]}>
              Active Table: {selectedTableName}
            </Text>
          </View>
        )}
      </View>

      {/* Categories Horizontal Bar */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {/* 'All' category option */}
          <TouchableOpacity
            onPress={() => selectCategory('all')}
            activeOpacity={0.7}
            style={[
              styles.categoryTab,
              { borderColor: colors.border, backgroundColor: colors.surface },
              selectedCategoryId === 'all' && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="apps"
              size={20}
              color={selectedCategoryId === 'all' ? '#FFFFFF' : colors.textPrimary}
            />
            <Text
              style={[
                styles.categoryLabel,
                { color: selectedCategoryId === 'all' ? '#FFFFFF' : colors.textPrimary },
                selectedCategoryId === 'all' && { fontWeight: TYPOGRAPHY.weights.bold },
              ]}
            >
              All Items
            </Text>
          </TouchableOpacity>

          {/* Individual Category items */}
          {categories.map((cat) => {
            const isActive = selectedCategoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => selectCategory(cat.id)}
                activeOpacity={0.7}
                style={[
                  styles.categoryTab,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  isActive && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={20}
                  color={isActive ? '#FFFFFF' : colors.textPrimary}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    { color: isActive ? '#FFFFFF' : colors.textPrimary },
                    isActive && { fontWeight: TYPOGRAPHY.weights.bold },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Grid of Product Cards */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No Items Found"
          description="We couldn't find any products matching your selection. Try searching something else."
          icon="food-off"
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <FlatList
          key={numColumns}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.gridItemCol, { width: itemWidth }]}>
              <ProductCard product={item} onPress={() => handleProductPress(item)} />
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SPACING.md,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    height: 52,
  },
  searchCol: {
    flex: 1,
  },
  tableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    marginLeft: SPACING.md,
    height: '100%',
  },
  tableTagText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: SPACING.xs,
  },
  categoriesSection: {
    height: 55,
    marginBottom: SPACING.md,
  },
  categoriesContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderRadius: RADIUS.full,
    marginRight: SPACING.xs,
    height: 40,
    ...SHADOWS.sm,
  },
  categoryLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.xs,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  gridRow: {
    justifyContent: 'flex-start',
  },
  gridItemCol: {
    padding: SPACING.xxs,
  },
});
