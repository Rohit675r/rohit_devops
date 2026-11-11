const STORE = {
  id: "voltcart",
  name: "VoltCart",
  theme: "volt",
  headline: "Upgrade your everyday setup.",
  intro: "Explore audio gear and desk accessories. Compare specs before you choose.",
  collectionTitle: "Find your next upgrade",
  cartTitle: "Your setup cart",
  heroImage: "https://images.unsplash.com/photo-1613629758552-443027994609?w=1200&q=85",
  heroAlt: "Black wireless headphones on a white tabletop",
  giftWrapPrice: 0,
  compare: true,
  products: [
    {
      id: "headphones",
      name: "Pulse Wireless Headphones",
      category: "Audio",
      spec: "Over-ear design · Wireless listening",
      price: 2499,
      image: "https://images.unsplash.com/photo-1613629758552-443027994609?w=640&q=80"
    },
    {
      id: "keyboard",
      name: "Nova Mechanical Keyboard",
      category: "Keyboards",
      spec: "Compact layout · Mechanical keys",
      price: 3499,
      image: "https://images.unsplash.com/photo-1684057770946-8c75c30e28e1?w=640&q=80"
    },
    {
      id: "mouse",
      name: "Arc Everyday Mouse",
      category: "Accessories",
      spec: "Wired connection · Scroll wheel",
      price: 899,
      image: "https://images.unsplash.com/photo-1697626858021-b75b6d6dba10?w=640&q=80"
    },
    {
      id: "speaker",
      name: "Echo Portable Speaker",
      category: "Audio",
      spec: "Portable audio · Carry strap",
      price: 1799,
      image: "https://images.unsplash.com/photo-1572183717150-0ca8073a2457?w=640&q=80"
    },
    {
      id: "charger",
      name: "Core USB Wall Charger",
      category: "Charging",
      spec: "Compact design · USB charging",
      price: 799,
      image: "https://images.unsplash.com/photo-1579675397338-7a83f91a51e7?w=640&q=80"
    },
    {
      id: "hub",
      name: "Link USB Hub",
      category: "Accessories",
      spec: "7 USB ports · Individual switches",
      price: 1999,
      image: "https://images.unsplash.com/photo-1760376789487-994070337c76?w=640&q=80"
    }
  ]
};
if (typeof module !== "undefined" && module.exports) {
  module.exports = STORE;
}