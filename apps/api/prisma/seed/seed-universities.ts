import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const universities = [
  "University of Nairobi", "Kenyatta University", "Jomo Kenyatta University of Agriculture and Technology",
  "Moi University", "Egerton University", "Maseno University", "Masinde Muliro University of Science and Technology",
  "Technical University of Kenya", "Technical University of Mombasa", "Dedan Kimathi University of Technology",
  "Chuka University", "Kisii University", "Laikipia University", "Meru University of Science and Technology",
  "Multimedia University of Kenya", "Pwani University", "University of Eldoret", "University of Kabianga",
  "Karatina University", "Kirinyaga University", "Machakos University", "Mama Ngina University",
  "Murang'a University of Technology", "Rongo University", "Taita Taveta University", "Tom Mboya University",
  "University of Embu", "Alupe University", "Kibabii University", "Zetech University", "Strathmore University",
  "United States International University Africa", "Daystar University", "Catholic University of Eastern Africa",
  "Africa Nazarene University", "Adventist University of Africa", "Kabarak University", "KCA University",
  "Mount Kenya University", "Pan Africa Christian University", "Riara University", "Scott Christian University",
  "St. Paul's University", "Africa International University", "Gretsa University", "Great Lakes University of Kisumu",
  "Kemu University", "Management University of Africa", "Nairobi University", "South Eastern Kenya University",
  "Cooperative University of Kenya", "Kenyatta University", "Egerton University", "Maseno University"
  // Adding 250 more generic domain placeholders for the demo
];

for (let i = 1; i <= 250; i++) {
  universities.push(`Regional Technical College ${i}`);
}

async function main() {
  console.log("Seeding database with universities...");
  for (const name of universities) {
    // Generate a domain based on the name, e.g., "Zetech University" -> "zetech.ac.ke"
    let baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (name.includes("Zetech")) baseName = "zetech";
    if (name.includes("University of Nairobi")) baseName = "uonbi";
    if (name.includes("Kenyatta")) baseName = "ku";
    
    const domain = `${baseName}.ac.ke`;

    await prisma.institution.upsert({
      where: { domain },
      update: {},
      create: {
        name: name,
        domain: domain,
      },
    });
  }
  console.log("✅ 300+ Universities seeded successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());