import { Hero } from "@/components/site/home/Hero";
import {
  PromiseBand,
  Services,
} from "@/components/site/home/PromiseAndServices";
import {
  BreakBand,
  FeaturedProjects,
  Process,
  ThreeVersions,
} from "@/components/site/home/ProjectsAndVersions";
import {
  Faq,
  LatestPosts,
  Testimonials,
  WorkingWith,
} from "@/components/site/home/SocialProof";
import { Contact, Membership } from "@/components/site/home/JoinAndContact";
import { PersonJsonLd } from "@/components/site/JsonLd";
import { getRecentPostsForHome } from "@/lib/blog";
import { getFeaturedProjects, getPublishedProjects } from "@/lib/projects";
import { getFeaturedTestimonials } from "@/lib/testimonials";
import { getSiteSettings } from "@/lib/settings";

/* Static HTML, revalidated by the admin whenever content changes; the hour
   is a safety net for changes made outside it. */
export const revalidate = 3600;

/**
 * Home — the thirteen sections of docs/03-PAGES.md, in order.
 *
 * Connected to dynamic database models and settings (Phase 9, 11).
 */
export default async function HomePage() {
  const [featured, published, recentPosts, settings, testimonials] =
    await Promise.all([
      getFeaturedProjects(),
      getPublishedProjects(),
      getRecentPostsForHome(3),
      getSiteSettings(),
      getFeaturedTestimonials(),
    ]);

  const projects =
    featured.length > 0 ? featured : published.slice(0, 3);

  return (
    <>
      <PersonJsonLd
        location={settings.location}
        socialLinks={settings.socialLinks}
        description={settings.bioShort || settings.bioLong}
      />
      <Hero settings={settings} />
      <PromiseBand />
      <Services services={settings.services} />
      <FeaturedProjects projects={projects} />
      <ThreeVersions />
      <BreakBand breakImage={settings.breakImage} />
      <Process steps={settings.processSteps} />
      <WorkingWith clients={settings.clients} />
      <Testimonials testimonials={testimonials} />
      <Faq faqItems={settings.faq} />
      <LatestPosts posts={recentPosts} />
      <Membership />
      <Contact />
    </>
  );
}
