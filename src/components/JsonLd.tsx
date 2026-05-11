/**
 * Server component. Inlines structured data as a <script type="application/ld+json">
 * so search engines and social embeds can read it.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
