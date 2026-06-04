import { motion as Motion } from "framer-motion";

const clients = [
  { name: "AWS", src: "/logos/aws.svg" },
  { name: "HashiCorp", src: "/logos/hashicorp.svg" },
  { name: "Tesco", src: "/logos/tesco.svg" },
  { name: "Deliveroo", src: "/logos/deliveroo.svg" },
  { name: "Rutgers", src: "/logos/rutgers.svg" },
  { name: "European Union", src: "/logos/european-union.svg" },
];

export function ClientCards() {
  return (
    <section id="clients" className="sect" style={{ background: "var(--surface-sunken)" }}>
      <div className="container-site">
        <Motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 400,
              fontSize: "clamp(34px, 4.6vw, 52px)",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: "var(--fg-1)",
              margin: "0 0 16px",
            }}
          >
            Used by teams who can't compromise.
          </h2>
          <p className="text-fg-2 text-lg leading-[1.55]" style={{ maxWidth: "52ch", margin: "0 auto" }}>
            From cloud platforms to public institutions, Steno keeps confidential
            conversations on-device.
          </p>
        </Motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
          {clients.map((client, i) => (
            <Motion.div
              key={client.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex flex-col items-center justify-center gap-4 py-8 px-4 rounded-lg"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <img
                src={client.src}
                alt={client.name}
                className="h-8 sm:h-9 w-auto dark:invert"
                style={{ opacity: 0.7 }}
              />
              <span className="text-fg-2 text-sm" style={{ fontWeight: 500 }}>
                {client.name}
              </span>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
