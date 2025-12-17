import {
  extend,
  Banner,
  BlockStack,
  Button,
  Text,
  View,
} from '@shopify/post-purchase-ui-extensions';

extend('purchase.post.render', (root, api) => {
  const { storage, done, extensionPoint, shop } = api;

  // Get order data
  const orderNumber = extensionPoint?.order?.name || '';
  const shopDomain = shop.storefrontUrl.replace('https://', '').replace('http://', '');

  const cta = root.createComponent(
    Button,
    {
      loading: false,
      onPress: async () => {
        // Open upload page with order info
        const uploadUrl = `https://${shopDomain}/apps/sharejoy/upload?order=${encodeURIComponent(orderNumber)}&shop=${encodeURIComponent(shopDomain)}`;
        await storage.update('redirect', uploadUrl);
        done();
      },
    },
    'Upload dit screenshot'
  );

  const content = root.createComponent(BlockStack, { spacing: 'base' }, [
    root.createComponent(Banner, { status: 'info', title: '🎁 Del & Få Rabat' }, [
      root.createComponent(Text, {}, 'Upload dit screenshot + ordrenummer efter købet, så sender vi voucher eller cashback når det er godkendt.'),
    ]),
    root.createComponent(View, { padding: 'base', border: 'base', borderRadius: 'base' }, [cta]),
  ]);

  root.appendChild(content);
});
