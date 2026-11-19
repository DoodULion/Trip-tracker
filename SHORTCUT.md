# Apple Pay Shortcut (Paste payment)

A web app can't see Apple Pay payments, so an iPhone Shortcut hands them over. Each time you tap to pay with a Wallet card, the Shortcut copies the payment to the clipboard. In Trip Tracker, **Add → Card → Paste payment** fills in the amount, the card and the merchant (as the note). You pick a category and tap Save. The dollars get filled in later, as usual, once the charge posts.

Needs iOS 17 or later. It only fires for in-person tap-to-pay payments, not online or in-app purchases.

## Set it up (once)

1. Open the **Shortcuts** app and go to the **Automation** tab.
2. Tap **+** (or **New Automation**), scroll down, and choose **Transaction**.
3. Under **Card**, select the cards you use on trips (for example Apple Card and Capital One). Leave Categories and Merchants as they are.
4. Choose **Run Immediately**, then tap **Next**.
5. Choose **New Blank Automation**.
6. Add the action **Text**. In its box, type these four lines:

   ```
   Trip Tracker payment
   Amount: 
   Merchant: 
   Card: 
   ```

   Then fill in each blank with the payment's details. Put the cursor after `Amount: `, tap **Shortcut Input** in the bar above the keyboard, then tap the blue **Shortcut Input** bubble you just added and change it to **Amount**. Do the same after `Merchant: ` (choose **Merchant**) and after `Card: ` (choose **Card or Pass**).

7. Add the action **Copy to Clipboard**. It copies the Text from the step above.
8. Optional reminder: add the action **Show Notification** with something like "Payment copied. Trip Tracker → Add → Paste payment."
9. Tap **Done**.

## Using it

1. Pay with Apple Pay.
2. Open Trip Tracker, tap **Add**, and tap **Paste payment**. When the phone asks, tap **Allow Paste**.
3. Check the amount, pick a category, and tap **Save**.

The clipboard holds only the latest payment, so paste it before your next tap to pay (or before you copy anything else).

## Good to know

- **Card names:** the card is picked when its name in your trip matches the one in Wallet, or one contains the other ("Capital One" matches "Capital One Venture X"). If nothing matches, the app says so and keeps your usual card.
- **Currency:** the amount is read in the trip's currency (yen for Japan). A payment charged in US dollars fills in the Dollars field instead. A payment in some other currency is refused, so you enter it by hand.
- **Date:** the entry is dated today. To send the payment's date instead, add a fourth line `Date: ` followed by **Current Date** with a custom format of `yyyy-MM-dd`.
- **Turning it off:** in Shortcuts → Automation, open the automation and switch it off, or swipe left to delete it.
