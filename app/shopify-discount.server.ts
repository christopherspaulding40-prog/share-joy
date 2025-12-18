/**
 * Shopify Discount Code Service
 * Creates discount codes via Shopify Admin GraphQL API
 */

interface CreateDiscountCodeParams {
  code: string;
  valueType: 'fixed' | 'percentage'; // fixed = fast beløb, percentage = procent af ordre
  amount?: number; // For fixed: beløb i øre (5000 = 50 DKK), for percentage: procent (30 = 30%)
  currency?: string; // Default: DKK
}

interface CreateDiscountCodeResult {
  success: boolean;
  discountId?: string;
  error?: string;
  details?: any;
}

/**
 * Creates a Shopify discount code
 * - fixed: Fast beløb (fx 50 DKK)
 * - percentage: Procent rabat (fx 30% af hele ordren)
 */
export async function createShopifyDiscountCode(
  admin: any,
  params: CreateDiscountCodeParams
): Promise<CreateDiscountCodeResult> {
  const { code, valueType, amount = 0, currency = 'DKK' } = params;

  try {
    console.log('[Shopify Discount] Creating discount code:', { code, valueType, amount });

    if (valueType === 'percentage') {
      // Create a percentage discount (e.g., 30% off entire order)
      const percentageValue = amount / 100; // Convert 30 to 0.30

      const mutation = `
        mutation CreatePercentageDiscount($input: DiscountCodeBasicInput!) {
          discountCodeBasicCreate(basicCodeDiscount: $input) {
            codeDiscountNode {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  title
                  codes(first: 1) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
              }
            }
            userErrors {
              field
              message
              code
            }
          }
        }
      `;

      const variables = {
        input: {
          title: code,
          code: code,
          startsAt: new Date().toISOString(),
          customerSelection: {
            all: true,
          },
          customerGets: {
            value: {
              percentage: percentageValue,
            },
            items: {
              all: true,
            },
          },
          usageLimit: 1,
        },
      };

      console.log('[Shopify Discount] Creating percentage discount:', code, 'with', amount + '%');

      const response = await admin.graphql(mutation, { variables });
      const result = await response.json();

      console.log('[Shopify Discount] Response:', JSON.stringify(result, null, 2));

      if (result.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
        const errors = result.data.discountCodeBasicCreate.userErrors;
        console.error('[Shopify Discount] Errors:', errors);
        return {
          success: false,
          error: errors.map((e: any) => `${e.code}: ${e.message}`).join(', '),
          details: errors,
        };
      }

      const discountId = result.data?.discountCodeBasicCreate?.codeDiscountNode?.id;
      if (discountId) {
        console.log('[Shopify Discount] ✓ Created percentage discount:', discountId);
        return { success: true, discountId };
      } else {
        return {
          success: false,
          error: 'No discount created',
          details: result,
        };
      }
    } else if (valueType === 'fixed') {
      // Create a fixed amount discount
      // amount is in øre (1 DKK = 100 øre), so convert to DKK for Shopify API
      const amountInDKK = (amount / 100).toFixed(2);

      const mutation = `
        mutation CreateFixedDiscount($input: DiscountCodeBasicInput!) {
          discountCodeBasicCreate(basicCodeDiscount: $input) {
            codeDiscountNode {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  title
                  codes(first: 1) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
              }
            }
            userErrors {
              field
              message
              code
            }
          }
        }
      `;

      const variables = {
        input: {
          title: code,
          code: code,
          startsAt: new Date().toISOString(),
          customerSelection: {
            all: true,
          },
          customerGets: {
            value: {
              fixedAmount: {
                amount: amountInDKK,
              },
            },
            items: {
              all: true,
            },
          },
          usageLimit: 1,
        },
      };

      console.log('[Shopify Discount] Creating fixed discount:', code, 'for', amountInDKK, currency);

      const response = await admin.graphql(mutation, { variables });
      const result = await response.json();

      console.log('[Shopify Discount] Response:', JSON.stringify(result, null, 2));

      if (result.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
        const errors = result.data.discountCodeBasicCreate.userErrors;
        console.error('[Shopify Discount] Errors:', errors);
        return {
          success: false,
          error: errors.map((e: any) => `${e.code}: ${e.message}`).join(', '),
          details: errors,
        };
      }

      const discountId = result.data?.discountCodeBasicCreate?.codeDiscountNode?.id;
      if (discountId) {
        console.log('[Shopify Discount] ✓ Created fixed discount:', discountId);
        return { success: true, discountId };
      } else {
        return {
          success: false,
          error: 'No discount created',
          details: result,
        };
      }
    }

    return {
      success: false,
      error: `Unknown value type: ${valueType}`,
    };
  } catch (error) {
    console.error('[Shopify Discount] Exception:', error);
    return {
      success: false,
      error: String(error),
      details: error,
    };
  }
}
