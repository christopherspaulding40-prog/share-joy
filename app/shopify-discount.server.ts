/**
 * Shopify Discount Code Service
 * Creates discount codes via Shopify Admin GraphQL API
 */

interface CreateDiscountCodeParams {
  code: string;
  type: 'percentage_first_order' | 'percentage_next_order';
  discountPercentage: number;
  orderAmount?: number; // For percentage_first_order calculations
  currency?: string; // Default: DKK
}

interface CreateDiscountCodeResult {
  success: boolean;
  discountId?: string;
  error?: string;
}

/**
 * Creates a Shopify discount code based on voucher type
 * - percentage_next_order: Fixed % off next order (e.g., 30% off entire order)
 * - percentage_first_order: Fixed amount based on % of first order (e.g., 30% of 500 DKK = 150 DKK voucher)
 */
export async function createShopifyDiscountCode(
  admin: any,
  params: CreateDiscountCodeParams
): Promise<CreateDiscountCodeResult> {
  const { code, type, discountPercentage, orderAmount, currency = 'DKK' } = params;

  try {
    if (type === 'percentage_next_order') {
      // Create a percentage discount (e.g., 30% off entire next order)
      const mutation = `
        mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
          discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
            codeDiscountNode {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        basicCodeDiscount: {
          title: code,
          code: code,
          startsAt: new Date().toISOString(),
          customerSelection: {
            all: true,
          },
          customerGets: {
            value: {
              percentage: (discountPercentage / 100),
            },
            items: {
              all: true,
            },
          },
          usageLimit: 1,
        },
      };

      console.log('[Shopify Discount] Creating percentage discount:', code, 'with', discountPercentage + '%');

      const response = await admin.graphql(mutation, { variables });
      const result = await response.json();

      console.log('[Shopify Discount] Full response:', JSON.stringify(result, null, 2));

      if (result.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
        const errors = result.data.discountCodeBasicCreate.userErrors;
        console.error('[Shopify Discount] User errors:', errors);
        return {
          success: false,
          error: errors.map((e: any) => `${e.field}: ${e.message}`).join(', '),
        };
      }

      if (!result.data?.discountCodeBasicCreate?.codeDiscountNode) {
        console.error('[Shopify Discount] No codeDiscountNode in response');
        return {
          success: false,
          error: 'No discount code created - check Shopify API response',
        };
      }

      const discountId = result.data.discountCodeBasicCreate.codeDiscountNode.id;
      console.log('[Shopify Discount] ✓ Created percentage discount:', discountId);

      return {
        success: true,
        discountId,
      };
    } else if (type === 'percentage_first_order') {
      // Create a fixed amount discount based on percentage of first order
      if (!orderAmount) {
        console.log('[Shopify Discount] No order amount - using percentage_next_order instead');
        // Fallback to percentage discount if no order amount
        return createShopifyDiscountCode(admin, {
          code,
          type: 'percentage_next_order',
          discountPercentage,
        });
      }

      const discountAmount = (orderAmount * discountPercentage) / 100;

      const mutation = `
        mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
          discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
            codeDiscountNode {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        basicCodeDiscount: {
          title: code,
          code: code,
          startsAt: new Date().toISOString(),
          customerSelection: {
            all: true,
          },
          customerGets: {
            value: {
              fixedAmountValue: {
                amount: discountAmount.toString(),
                currencyCode: currency,
              },
            },
            items: {
              all: true,
            },
          },
          usageLimit: 1,
        },
      };

      console.log('[Shopify Discount] Creating fixed amount discount:', code, 'for', discountAmount.toFixed(2), 'DKK');

      const response = await admin.graphql(mutation, { variables });
      const result = await response.json();

      console.log('[Shopify Discount] Full response:', JSON.stringify(result, null, 2));

      if (result.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
        const errors = result.data.discountCodeBasicCreate.userErrors;
        console.error('[Shopify Discount] User errors:', errors);
        return {
          success: false,
          error: errors.map((e: any) => `${e.field}: ${e.message}`).join(', '),
        };
      }

      if (!result.data?.discountCodeBasicCreate?.codeDiscountNode) {
        console.error('[Shopify Discount] No codeDiscountNode in response');
        return {
          success: false,
          error: 'No discount code created - check Shopify API response',
        };
      }

      const discountId = result.data.discountCodeBasicCreate.codeDiscountNode.id;
      console.log('[Shopify Discount] ✓ Created fixed amount discount:', discountId);

      return {
        success: true,
        discountId,
      };
    }

    return {
      success: false,
      error: `Unknown voucher type: ${type}`,
    };
  } catch (error) {
    console.error('[Shopify Discount] Error creating discount:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}
