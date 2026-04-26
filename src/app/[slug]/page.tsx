import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StorefrontClient from "./StorefrontClient";
import Script from "next/script";

import { Metadata } from "next";

export const revalidate = 60; // Revalida o cache a cada 60 segundos (ISR)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    select: { name: true, description: true, logo: true, city: true, state: true, address: true }
  });

  if (!store) return { title: "PedeUe - Loja não encontrada" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pedeue.com";
  const location = store.city ? ` em ${store.city} - ${store.state}` : "";
  const title = `${store.name} | Cardápio Digital${location}`;
  const description = store.description || `Confira os produtos e faça seu pedido online na loja ${store.name}${location}. Entregas rápidas e melhor preço.`;
  
  let imageUrl = store.logo || "/icon-512x512.png";
  if (imageUrl.startsWith("/")) {
    imageUrl = `${baseUrl}${imageUrl}`;
  }

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: `${store.name}, delivery ${store.city}, cardápio online ${store.name}, pedir comida ${store.city}`,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${slug}`,
      siteName: "PedeUe",
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: store.name,
        },
      ],
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    icons: {
      icon: imageUrl,
      apple: imageUrl,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Busca inicial no servidor para ISR
  // Busca inicial simplificada para pegar o storeType
  const initialStore = await prisma.store.findUnique({
    where: { slug },
    select: { id: true, storeType: true, name: true, logo: true, city: true, state: true, address: true, whatsapp: true }
  });

  if (!initialStore) {
    notFound();
  }

  const currentStoreType = initialStore.storeType || "RESTAURANT";

  // Busca completa com filtros
  const store = await prisma.store.findUnique({
    where: { id: initialStore.id },
    include: {
      category: {
        where: {
            isActive: true,
            storeType: currentStoreType
        },
        orderBy: {
            position: 'asc'
        },
        include: {
          product: {
            where: {
                isActive: true,
                productType: currentStoreType
            },
            orderBy: {
                position: 'asc'
            },
            include: {
              optiongroup: {
                include: {
                  option: true
                }
              }
            }
          }
        }
      },
      deliveryarea: true,
      upsell_rules: {
        where: { isActive: true }
      }
    }

  });

  if (!store) {
    notFound();
  }

  // Schema.org JSON-LD
  const schema = {
    "@context": "https://schema.org",
    "@type": store.storeType === "RESTAURANT" ? "Restaurant" : "LocalBusiness",
    "name": store.name,
    "image": store.logo,
    "url": `${process.env.NEXT_PUBLIC_APP_URL || "https://pedeue.com"}/${slug}`,
    "telephone": store.whatsapp,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": store.address,
      "addressLocality": store.city,
      "addressRegion": store.state,
      "addressCountry": "BR"
    },
    "priceRange": "R$",
    "servesCuisine": "Variada"
  };

  // Sanitização simples para garantir que o objeto seja serializável
  const sanitizedStore = JSON.parse(JSON.stringify(store));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* Facebook Pixel */}
      {store.facebookPixelId && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${store.facebookPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Google Analytics */}
      {store.googleAnalyticsId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${store.googleAnalyticsId}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${store.googleAnalyticsId}');
            `}
          </Script>
        </>
      )}

      {/* Google Tag Manager */}
      {store.googleTagManagerId && (
        <Script id="gtm" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${store.googleTagManagerId}');
          `}
        </Script>
      )}

      {/* TikTok Pixel */}
      {store.tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","detach","hooks","unidentify"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n;var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${store.tiktokPixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      <StorefrontClient 
        initialStore={sanitizedStore} 
        slug={slug} 
      />
    </>
  );
}
