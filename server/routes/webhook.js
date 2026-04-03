const express = require('express');
const router = express.Router();
// const { dbRun, dbGet } = require('../db');

// POST /api/webhook/stripe
// 決済プラットフォーム（Stripe等）からのWebhook受け口
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // 1. Stripeシグネチャの検証（※本番ではstripe-nodeを用いて実検証を行う）
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    // 現在はシミュレーションとしてそのままJSONパース
    let event;
    try {
      event = JSON.parse(req.body);
    } catch (e) {
      if (req.body && req.body.type) {
        event = req.body;
      } else {
        return res.status(400).send('Webhook Error: Payload parsing failed');
      }
    }

    // 2. 決済完了イベントのハンドリング
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_details?.email;
      const customerId = session.customer;
      
      // TODO: emailに紐づくテナント・ライセンスを探索し自動付与などのロジック
      // const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
      // if (user) {
      //   // 既存ライセンスを30日延長
      //   await dbRun('UPDATE license_keys SET expires_at = NOW() + INTERVAL \\'30 days\\', is_active = 1 WHERE user_id = ?', [user.id]);
      // }
      
      console.log(`[Webhook] Stripe Checkout Completed for ${email || customerId}`);
    } else if (event.type === 'invoice.payment_succeeded') {
      // サブスクリプション月次更新完了
      const invoice = event.data.object;
      console.log(`[Webhook] Subscription Payment Succeeded: ${invoice.id}`);
    } else if (event.type === 'invoice.payment_failed') {
      // 決済失敗（ライセンス無効化など）
      console.log(`[Webhook] Payment Failed! Lock the license.`);
    }

    // Stripeには必ず200 OKを返す（返さないとリトライされ続けるため）
    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook Error]', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;
