import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/theme/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Order } from '@/mock/data';
import { formatThermalReceipt, printBill } from '@/services/printService';
import { Button } from './Button';

interface ReceiptPreviewModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onPrintSuccess?: (msg: string) => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  visible,
  order,
  onClose,
  onPrintSuccess,
}) => {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = COLORS[themeMode];
  const { width: screenWidth } = useWindowDimensions();
  const [printing, setPrinting] = useState(false);
  const [copies, setCopies] = useState(1);

  if (!order) return null;

  const receipt = formatThermalReceipt(order);
  const modalWidth = screenWidth < 1024 ? '85%' : screenWidth < 1400 ? '480px' : '520px';

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const res = await printBill(order, { copies });
      setPrinting(false);
      onClose();
      if (onPrintSuccess) {
        onPrintSuccess(res.message);
      }
    } catch {
      setPrinting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              width: modalWidth as any,
            },
            SHADOWS.xl,
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleCol}>
              <View style={styles.headerIconRow}>
                <MaterialCommunityIcons name="printer-pos" size={24} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  80mm Thermal Receipt Preview
                </Text>
              </View>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Standard ESC/POS formatted receipt for {order.orderNumber}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 80mm Receipt Body Scroll (Simulating Thermal Paper roll) */}
          <ScrollView
            style={styles.paperScrollView}
            contentContainerStyle={styles.paperScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.thermalPaperRoll}>
              {/* Paper Top Jagged/Tear Line */}
              <View style={styles.paperTearTop} />

              {/* Restaurant Header */}
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptBrandTitle}>{receipt.header.restaurantName}</Text>
                <Text style={styles.receiptBrandSub}>{receipt.header.branch}</Text>
                <Text style={styles.receiptBrandAddress}>{receipt.header.address}</Text>
                <Text style={styles.receiptBrandContact}>Ph: {receipt.header.phone}</Text>
                <Text style={styles.receiptGst}>GSTIN: {receipt.header.gstNumber}</Text>
              </View>

              <Text style={styles.receiptDivider}>- - - - - - - - - - - - - - - - - - - - - -</Text>

              {/* Meta Info */}
              <View style={styles.receiptMetaGrid}>
                <View style={styles.metaRow}>
                  <Text style={styles.receiptMonoBold}>INVOICE: #{receipt.meta.orderNumber}</Text>
                  <Text style={styles.receiptMono}>{receipt.meta.orderType}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.receiptMono}>Date: {receipt.meta.date}</Text>
                  <Text style={styles.receiptMono}>Time: {receipt.meta.time}</Text>
                </View>
                {receipt.meta.tableName && (
                  <View style={styles.metaRow}>
                    <Text style={styles.receiptMonoBold}>Table: {receipt.meta.tableName}</Text>
                    {receipt.meta.floorName && (
                      <Text style={styles.receiptMono}>({receipt.meta.floorName})</Text>
                    )}
                  </View>
                )}
                {receipt.meta.waiterName && (
                  <View style={styles.metaRow}>
                    <Text style={styles.receiptMono}>Server: {receipt.meta.waiterName}</Text>
                  </View>
                )}
                {receipt.meta.customerName && (
                  <View style={styles.metaRow}>
                    <Text style={styles.receiptMono}>
                      Customer: {receipt.meta.customerName}{' '}
                      {receipt.meta.customerPhone ? `(${receipt.meta.customerPhone})` : ''}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.receiptDivider}>==========================================</Text>

              {/* Item Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.receiptMonoBold, { flex: 2.2 }]}>ITEM</Text>
                <Text style={[styles.receiptMonoBold, { width: 36, textAlign: 'center' }]}>QTY</Text>
                <Text style={[styles.receiptMonoBold, { width: 60, textAlign: 'right' }]}>RATE</Text>
                <Text style={[styles.receiptMonoBold, { width: 70, textAlign: 'right' }]}>AMT</Text>
              </View>

              <Text style={styles.receiptDivider}>- - - - - - - - - - - - - - - - - - - - - -</Text>

              {/* Items List */}
              {receipt.items.map((item, idx) => (
                <View key={idx} style={styles.itemRowContainer}>
                  <View style={styles.itemMainRow}>
                    <Text style={[styles.receiptMono, { flex: 2.2 }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={[styles.receiptMono, { width: 36, textAlign: 'center' }]}>
                      {item.quantity}
                    </Text>
                    <Text style={[styles.receiptMono, { width: 60, textAlign: 'right' }]}>
                      {item.price.toFixed(1)}
                    </Text>
                    <Text style={[styles.receiptMonoBold, { width: 70, textAlign: 'right' }]}>
                      {item.amount.toFixed(2)}
                    </Text>
                  </View>
                  {item.notes && (
                    <Text style={styles.itemNotesMono}>* {item.notes}</Text>
                  )}
                </View>
              ))}

              <Text style={styles.receiptDivider}>- - - - - - - - - - - - - - - - - - - - - -</Text>

              {/* Math Totals */}
              <View style={styles.totalsContainer}>
                <View style={styles.totalLine}>
                  <Text style={styles.receiptMono}>Subtotal:</Text>
                  <Text style={styles.receiptMono}>{receipt.totals.subtotal}</Text>
                </View>
                {order.discount > 0 && (
                  <View style={styles.totalLine}>
                    <Text style={styles.receiptMono}>Discount Applied:</Text>
                    <Text style={styles.receiptMono}>-{receipt.totals.discountAmount}</Text>
                  </View>
                )}
                <View style={styles.totalLine}>
                  <Text style={styles.receiptMono}>GST (18% Total):</Text>
                  <Text style={styles.receiptMono}>{receipt.totals.gstAmount}</Text>
                </View>
                <Text style={styles.receiptDivider}>==========================================</Text>
                <View style={styles.grandTotalLine}>
                  <Text style={styles.grandTotalLabel}>GRAND TOTAL:</Text>
                  <Text style={styles.grandTotalValue}>{receipt.totals.grandTotal}</Text>
                </View>
                <Text style={styles.receiptDivider}>==========================================</Text>
                <View style={styles.totalLine}>
                  <Text style={styles.receiptMonoBold}>Payment Mode:</Text>
                  <Text style={styles.receiptMonoBold}>{receipt.totals.paymentMethod}</Text>
                </View>
              </View>

              {/* Barcode Simulator */}
              <View style={styles.barcodeWrapper}>
                <View style={styles.barcodeLines}>
                  {[...Array(28)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.barcodeBar,
                        {
                          width: (i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1),
                          marginRight: (i % 4 === 0 ? 3 : 2),
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.barcodeText}>*{receipt.meta.orderNumber}*</Text>
              </View>

              {/* Footer Note */}
              <View style={styles.receiptFooter}>
                <Text style={styles.receiptThankYou}>{receipt.footer.thankYouMessage}</Text>
                {receipt.footer.fssaiLicense && (
                  <Text style={styles.receiptFssai}>{receipt.footer.fssaiLicense}</Text>
                )}
                <Text style={styles.receiptPowered}>{receipt.footer.poweredBy}</Text>
              </View>

              {/* Paper Bottom Jagged/Tear Line */}
              <View style={styles.paperTearBottom} />
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <View style={styles.copiesSelector}>
              <Text style={[styles.copiesLabel, { color: colors.textSecondary }]}>Copies:</Text>
              <TouchableOpacity
                onPress={() => setCopies(Math.max(1, copies - 1))}
                style={[styles.copyBtn, { borderColor: colors.border }]}
                disabled={copies <= 1}
              >
                <MaterialCommunityIcons name="minus" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.copiesCount, { color: colors.textPrimary }]}>{copies}</Text>
              <TouchableOpacity
                onPress={() => setCopies(copies + 1)}
                style={[styles.copyBtn, { borderColor: colors.border }]}
              >
                <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.footerButtons}>
              <Button
                label="Close"
                variant="outline"
                onPress={onClose}
                style={styles.closeFooterBtn}
              />
              <Button
                label={printing ? 'Printing...' : 'Send to Printer (80mm)'}
                variant="primary"
                icon="printer"
                onPress={handlePrint}
                disabled={printing}
                style={styles.printActionBtn}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContainer: {
    maxHeight: '90%',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  paperScrollView: {
    flex: 1,
    backgroundColor: '#334155', // Slate contrast backdrop behind thermal receipt
  },
  paperScrollContent: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  thermalPaperRoll: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  paperTearTop: {
    height: 4,
    backgroundColor: '#E2E8F0',
    marginBottom: SPACING.sm,
    borderRadius: 2,
  },
  paperTearBottom: {
    height: 4,
    backgroundColor: '#E2E8F0',
    marginTop: SPACING.md,
    borderRadius: 2,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  receiptBrandTitle: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  receiptBrandSub: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#111111',
    marginTop: 1,
  },
  receiptBrandAddress: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#222222',
    textAlign: 'center',
    marginTop: 2,
  },
  receiptBrandContact: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#222222',
    marginTop: 1,
  },
  receiptGst: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 2,
  },
  receiptDivider: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#444444',
    textAlign: 'center',
    marginVertical: 4,
  },
  receiptMetaGrid: {
    marginVertical: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  receiptMono: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#111111',
  },
  receiptMonoBold: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemRowContainer: {
    marginBottom: 4,
  },
  itemMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemNotesMono: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontStyle: 'italic',
    color: '#555555',
    marginLeft: SPACING.xs,
    marginTop: 1,
  },
  totalsContainer: {
    marginTop: 2,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  grandTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  grandTotalLabel: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  grandTotalValue: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  barcodeWrapper: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  barcodeBar: {
    height: '100%',
    backgroundColor: '#000000',
  },
  barcodeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#333333',
    marginTop: 2,
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  receiptThankYou: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  receiptFssai: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#444444',
    marginTop: 2,
  },
  receiptPowered: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#666666',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  copiesSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copiesLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginRight: SPACING.xs,
  },
  copyBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copiesCount: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: 'bold',
    marginHorizontal: SPACING.xs,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeFooterBtn: {
    minWidth: 80,
    marginRight: SPACING.sm,
    minHeight: 44,
  },
  printActionBtn: {
    minWidth: 180,
    minHeight: 44,
  },
});
