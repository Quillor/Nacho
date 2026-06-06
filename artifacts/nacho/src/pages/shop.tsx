import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@workspace/pico-ui/button";
import { Card } from "@workspace/pico-ui/card";
import { Badge } from "@workspace/pico-ui/badge";
import { ShoppingBag, X, ZoomIn } from "lucide-react";
import { Logo } from "@/components/logo";
import teeFlat from "@assets/image_1780729762006.png";
import teeLifestyle from "@assets/image_1780729757624.png";
import nachosBag from "@assets/image_1780729866536.png";
import nachoMug from "@assets/image_1780730210640.png";
import salsaJar from "@assets/image_1780730696690.png";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

type Product = {
  name: string;
  tagline: string;
  price: string;
  image: string;
  hoverImage?: string;
  mediaBg: string;
};

const products: Product[] = [
  {
    name: "Nacho T-Shirt",
    tagline: "Cancel the meeting, give time back. Worn here, loved everywhere.",
    price: "$32",
    image: teeFlat,
    hoverImage: teeLifestyle,
    mediaBg: "bg-accent"
  },
  {
    name: "Nachos",
    tagline: "Bold. Cheesy. Unapologetic. A 9oz bag of actual snackable nachos.",
    price: "$9",
    image: nachosBag,
    mediaBg: "bg-primary"
  },
  {
    name: "Mug",
    tagline: "Send nachos, sip coffee. The ceramic companion to your morning clips.",
    price: "$18",
    image: nachoMug,
    mediaBg: "bg-destructive"
  },
  {
    name: "Nacho salsa",
    tagline: "Extra picante. Bold, spicy, and authentic. The perfect pairing for your snackable clips.",
    price: "$7",
    image: salsaJar,
    mediaBg: "bg-accent"
  }
];

export default function Shop() {
  const [lightbox, setLightbox] = useState<Product | null>(null);

  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, close]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-hidden selection:bg-accent selection:text-accent-foreground font-sans">

      {/* Navigation */}
      <nav data-pico-section="navbar" className="fixed top-0 left-0 right-0 z-50 border-b-2 border-foreground bg-background py-4 px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="Nacho home">
          <Logo className="h-9" />
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="hidden md:flex font-bold">
            <Link href="/shop">Shop</Link>
          </Button>
          <Button asChild variant="ghost" className="hidden md:flex">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild variant="brand">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </nav>

      <main>

        {/* Hero */}
        <section data-pico-section="hero" className="relative pt-40 pb-20 px-6 md:px-12 border-b-2 border-foreground overflow-hidden bg-accent">
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="inline-block mb-6"
            >
              <Badge variant="outline" className="px-4 py-2 text-sm uppercase tracking-wider text-accent-foreground inline-flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                The Nacho merch stand
              </Badge>
            </motion.div>
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-5xl md:text-7xl font-display font-extrabold tracking-tight leading-[0.95] mb-6 text-accent-foreground"
            >
              Wear the brand. <br /> Snack the brand.
            </motion.h1>
            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-xl md:text-2xl font-medium leading-relaxed text-accent-foreground/80 max-w-2xl mx-auto"
            >
              A tiny drop of golden goods for people who'd rather send a clip than sit in a meeting. Sorry — every last piece is gone.
            </motion.p>
          </div>
        </section>

        {/* Product Grid */}
        <section data-pico-section="products" className="py-24 px-6 md:px-12 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product, i) => (
                <motion.div
                  key={product.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full border-2 border-foreground shadow-xl overflow-hidden flex flex-col group">
                    {/* Clickable image tile */}
                    <button
                      type="button"
                      onClick={() => setLightbox(product)}
                      className={`aspect-square w-full border-b-2 border-foreground relative overflow-hidden ${product.mediaBg} cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground`}
                      aria-label={`View ${product.name} full size`}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${product.hoverImage ? "group-hover:opacity-0" : ""}`}
                      />
                      {product.hoverImage && (
                        <img
                          src={product.hoverImage}
                          alt={`${product.name} worn`}
                          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        />
                      )}
                      <Badge
                        variant="destructive"
                        className="absolute top-4 right-4 uppercase tracking-wider shadow-sm border-2 border-foreground"
                      >
                        Sold out
                      </Badge>
                      {/* Zoom hint */}
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center">
                        <ZoomIn className="w-10 h-10 text-background opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                      </div>
                    </button>

                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h2 className="text-3xl font-display font-extrabold leading-[1.1] tracking-tight text-card-foreground">{product.name}</h2>
                        <span className="text-2xl font-display font-extrabold text-muted-foreground line-through shrink-0">{product.price}</span>
                      </div>
                      <p className="text-muted-foreground font-medium text-lg mb-8 flex-1">{product.tagline}</p>
                      <Button
                        variant="secondary"
                        size="lg"
                        disabled
                        className="w-full uppercase tracking-wider cursor-not-allowed"
                      >
                        Sold out
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-lg font-medium text-foreground/70 mt-16"
            >
              More golden goods are dreaming themselves up. Check back soon.
            </motion.p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer data-pico-section="footer" className="py-12 px-6 md:px-12 border-t-2 border-foreground bg-background text-foreground">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center" aria-label="Nacho home">
            <Logo className="h-10" />
          </Link>
          <div className="flex gap-6 font-bold text-foreground/80">
            <Link href="/shop" className="hover:text-foreground hover:underline transition-colors">Shop</Link>
            <Link href="/terms" className="hover:text-foreground hover:underline transition-colors">Terms</Link>
            <a href="/design-system/" className="hover:text-foreground hover:underline transition-colors">Design System</a>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
            onClick={close}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-foreground/80 backdrop-blur-sm" />

            {/* Panel */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 bg-background border-2 border-foreground shadow-2xl rounded-xl overflow-hidden max-w-3xl w-full max-h-[90dvh] flex flex-col"
            >
              {/* Close button */}
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-foreground bg-accent shrink-0">
                <span className="font-display font-extrabold text-xl text-accent-foreground">{lightbox.name}</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="w-9 h-9 flex items-center justify-center border-2 border-foreground rounded-md bg-background text-foreground hover:bg-foreground hover:text-background transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image */}
              <div className="overflow-auto flex-1 flex items-center justify-center bg-card p-4">
                <img
                  src={lightbox.image}
                  alt={lightbox.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
