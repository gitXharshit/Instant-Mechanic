import 'dotenv/config';
import { PrismaClient, BookingStatus, MechanicStatus, ServiceCategory } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Data arrays ────────────────────────────────────────────────────────────

const firstNames = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah',
  'Thomas', 'Karen', 'Charles', 'Lisa', 'Christopher', 'Nancy', 'Daniel', 'Betty',
  'Matthew', 'Margaret', 'Anthony', 'Sandra', 'Mark', 'Ashley', 'Donald', 'Kimberly',
  'Steven', 'Emily', 'Paul', 'Donna', 'Andrew', 'Michelle', 'Joshua', 'Carol',
  'Kenneth', 'Amanda', 'Kevin', 'Melissa', 'Brian', 'Deborah', 'George', 'Stephanie',
  'Timothy', 'Rebecca', 'Ronald', 'Sharon', 'Edward', 'Laura', 'Jason', 'Cynthia',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
];

const cities = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Sheffield',
  'Bradford', 'Liverpool', 'Edinburgh', 'Bristol', 'Cardiff', 'Coventry',
  'Nottingham', 'Leicester', 'Southampton', 'Portsmouth', 'Newcastle', 'Brighton',
];

const vehicleMakes = [
  'Toyota', 'Ford', 'Honda', 'BMW', 'Mercedes', 'Volkswagen', 'Audi',
  'Nissan', 'Hyundai', 'Kia', 'Chevrolet', 'Renault', 'Peugeot', 'Vauxhall',
  'Land Rover', 'Jaguar', 'Volvo', 'Mazda', 'Subaru', 'Mitsubishi',
];

const vehicleModels: Record<string, string[]> = {
  Toyota: ['Corolla', 'Camry', 'RAV4', 'Yaris', 'Aygo', 'Prius', 'Land Cruiser'],
  Ford: ['Focus', 'Fiesta', 'Mondeo', 'Kuga', 'Puma', 'Mustang', 'Explorer'],
  Honda: ['Civic', 'CR-V', 'Jazz', 'HR-V', 'Accord', 'Pilot'],
  BMW: ['3 Series', '5 Series', 'X3', 'X5', '1 Series', '7 Series', 'X1'],
  Mercedes: ['A-Class', 'C-Class', 'E-Class', 'GLC', 'GLA', 'S-Class'],
  Volkswagen: ['Golf', 'Polo', 'Tiguan', 'Passat', 'T-Roc', 'ID.4'],
  Audi: ['A3', 'A4', 'Q3', 'Q5', 'A6', 'Q7'],
  Nissan: ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Navara'],
  Hyundai: ['i20', 'i30', 'Tucson', 'Santa Fe', 'Kona', 'Ioniq'],
  Kia: ['Picanto', 'Rio', 'Sportage', 'Sorento', 'EV6', 'Stinger'],
  Chevrolet: ['Spark', 'Cruze', 'Equinox', 'Malibu', 'Camaro'],
  Renault: ['Clio', 'Megane', 'Kadjar', 'Captur', 'Zoe'],
  Peugeot: ['208', '308', '3008', '5008', '2008'],
  Vauxhall: ['Corsa', 'Astra', 'Mokka', 'Insignia', 'Grandland'],
  'Land Rover': ['Discovery', 'Defender', 'Range Rover', 'Freelander', 'Evoque'],
  Jaguar: ['XE', 'XF', 'F-Pace', 'E-Pace', 'I-Pace'],
  Volvo: ['XC40', 'XC60', 'XC90', 'V60', 'S90'],
  Mazda: ['Mazda2', 'Mazda3', 'CX-3', 'CX-5', 'MX-5'],
  Subaru: ['Impreza', 'Forester', 'Outback', 'XV', 'Legacy'],
  Mitsubishi: ['Outlander', 'Eclipse Cross', 'L200', 'Colt'],
};

const mechanicSpecializations = [
  [ServiceCategory.OIL_CHANGE, ServiceCategory.FULL_SERVICE],
  [ServiceCategory.BRAKE_SERVICE, ServiceCategory.SUSPENSION],
  [ServiceCategory.ENGINE_DIAGNOSTIC, ServiceCategory.ELECTRICAL],
  [ServiceCategory.TYRE_SERVICE, ServiceCategory.BRAKE_SERVICE],
  [ServiceCategory.AC_SERVICE, ServiceCategory.ELECTRICAL],
  [ServiceCategory.BATTERY_SERVICE, ServiceCategory.ELECTRICAL],
  [ServiceCategory.TRANSMISSION, ServiceCategory.ENGINE_DIAGNOSTIC],
  [ServiceCategory.FULL_SERVICE, ServiceCategory.OIL_CHANGE, ServiceCategory.BRAKE_SERVICE],
  [ServiceCategory.ROADSIDE_ASSISTANCE, ServiceCategory.TYRE_SERVICE],
  [ServiceCategory.DETAILING],
];

const serviceAmounts: Record<ServiceCategory, [number, number]> = {
  OIL_CHANGE: [49, 89],
  BRAKE_SERVICE: [120, 280],
  TYRE_SERVICE: [80, 320],
  BATTERY_SERVICE: [90, 180],
  ENGINE_DIAGNOSTIC: [75, 250],
  AC_SERVICE: [85, 220],
  FULL_SERVICE: [199, 399],
  ELECTRICAL: [100, 350],
  SUSPENSION: [150, 400],
  TRANSMISSION: [250, 800],
  DETAILING: [60, 200],
  ROADSIDE_ASSISTANCE: [50, 150],
};

const statusWeights: [BookingStatus, number][] = [
  [BookingStatus.COMPLETED, 55],
  [BookingStatus.PENDING, 15],
  [BookingStatus.ASSIGNED, 10],
  [BookingStatus.ON_THE_WAY, 5],
  [BookingStatus.IN_PROGRESS, 5],
  [BookingStatus.CANCELLED, 10],
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function weightedRand<T>(weights: [T, number][]): T {
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [val, weight] of weights) {
    r -= weight;
    if (r <= 0) return val;
  }
  return weights[weights.length - 1][0];
}

function randDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(randInt(7, 20), randInt(0, 59), 0, 0);
  return d;
}

function generatePlate(): string {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXY';
  return `${rand(letters.split(''))}${rand(letters.split(''))}${randInt(10, 69)} ${rand(letters.split(''))}${rand(letters.split(''))}${rand(letters.split(''))}`;
}

function generatePhone(): string {
  return `07${randInt(100, 999)}${randInt(100000, 999999)}`;
}

// ─── Seed ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.mechanic.deleteMany();
  await prisma.customer.deleteMany();
  console.log('✅ Cleared existing data');

  // Create 25 Mechanics
  const mechanicNames = [
    'Jake Harrison', 'Carlos Mendez', 'Liam O\'Brien', 'Tariq Ahmed', 'Ben Foster',
    'Marcus Webb', 'Kieran Shaw', 'Raj Patel', 'Tom Bradley', 'Dario Rossi',
    'Anya Kowalski', 'Sam Okafor', 'Felix Braun', 'Oliver Marsh', 'Dean Lawson',
    'Nathan Price', 'Ibrahim Hassan', 'Connor Murphy', 'Zach Turner', 'Aaron Reid',
    'Priya Sharma', 'Leo Costa', 'Hugo Martin', 'Finn Andersen', 'Kyle Fletcher',
  ];

  const mechanicLocations = [
    { location: 'London Central', lat: 51.5074, lng: -0.1278 },
    { location: 'London East', lat: 51.5155, lng: -0.0723 },
    { location: 'London North', lat: 51.5500, lng: -0.1200 },
    { location: 'Manchester City', lat: 53.4808, lng: -2.2426 },
    { location: 'Birmingham', lat: 52.4862, lng: -1.8904 },
    { location: 'Leeds', lat: 53.8008, lng: -1.5491 },
    { location: 'Glasgow', lat: 55.8642, lng: -4.2518 },
    { location: 'Bristol', lat: 51.4545, lng: -2.5879 },
  ];

  const mechanics = await Promise.all(
    mechanicNames.map(async (name, i) => {
      const statusRoll = Math.random();
      const status = statusRoll < 0.5 ? MechanicStatus.AVAILABLE :
        statusRoll < 0.75 ? MechanicStatus.BUSY : MechanicStatus.OFF_DUTY;
      const loc = rand(mechanicLocations);

      return prisma.mechanic.create({
        data: {
          name,
          email: `${name.toLowerCase().replace(/[' ]/g, '.').replace('..', '.')}@instantmechanic.com`,
          phone: generatePhone(),
          specialization: mechanicSpecializations[i % mechanicSpecializations.length],
          status,
          rating: randFloat(3.8, 5.0),
          jobsCompleted: randInt(20, 450),
          location: loc.location,
          latitude: loc.lat + (Math.random() - 0.5) * 0.05,
          longitude: loc.lng + (Math.random() - 0.5) * 0.05,
          joinedAt: randDate(730),
        },
      });
    })
  );
  console.log(`✅ Created ${mechanics.length} mechanics`);

  // Create 60 Customers
  const customers = await Promise.all(
    Array.from({ length: 60 }, async (_, i) => {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 40 ? i : ''}@email.com`;

      return prisma.customer.create({
        data: {
          name,
          email,
          phone: generatePhone(),
          city: rand(cities),
          address: `${randInt(1, 200)} ${rand(['High Street', 'Church Lane', 'Station Road', 'Mill Road', 'Park Avenue', 'Victoria Road'])}`,
          createdAt: randDate(365),
        },
      });
    })
  );
  console.log(`✅ Created ${customers.length} customers`);

  // Create 520+ Bookings
  const bookings = [];
  const services = Object.values(ServiceCategory);

  for (let i = 0; i < 520; i++) {
    const customer = rand(customers);
    const service = rand(services);
    const [minAmt, maxAmt] = serviceAmounts[service];
    const amount = randFloat(minAmt, maxAmt);
    const status = weightedRand(statusWeights);
    const scheduledAt = randDate(180);

    const needsMechanic = status !== BookingStatus.PENDING && status !== BookingStatus.CANCELLED;
    const mechanic = needsMechanic ? rand(mechanics) : null;

    const make = rand(vehicleMakes);
    const models = vehicleModels[make] || ['Model'];

    bookings.push({
      bookingNumber: `IM-${(10000 + i).toString(36).toUpperCase()}-${randInt(10, 99)}`,
      customerId: customer.id,
      mechanicId: mechanic?.id || null,
      vehicleMake: make,
      vehicleModel: rand(models),
      vehicleYear: randInt(2005, 2024),
      vehiclePlate: generatePlate(),
      service,
      serviceDetails: `Standard ${service.toLowerCase().replace(/_/g, ' ')} service`,
      status,
      amount,
      scheduledAt,
      completedAt: status === BookingStatus.COMPLETED
        ? new Date(scheduledAt.getTime() + randInt(30, 180) * 60 * 1000)
        : null,
      notes: Math.random() > 0.7 ? rand([
        'Customer requested early morning slot',
        'Vehicle has existing scratches',
        'Previous service done elsewhere',
        'Customer has warranty',
        'Urgent - vehicle not driveable',
      ]) : null,
      createdAt: new Date(scheduledAt.getTime() - randInt(1, 7) * 24 * 60 * 60 * 1000),
    });
  }

  // Batch insert
  for (let i = 0; i < bookings.length; i += 50) {
    await prisma.booking.createMany({ data: bookings.slice(i, i + 50) });
    process.stdout.write(`\r📦 Inserted ${Math.min(i + 50, bookings.length)}/${bookings.length} bookings`);
  }

  console.log(`\n✅ Created ${bookings.length} bookings`);

  // Summary
  const [totalCustomers, totalMechanics, totalBookings] = await Promise.all([
    prisma.customer.count(),
    prisma.mechanic.count(),
    prisma.booking.count(),
  ]);

  console.log('\n🎉 Seeding complete!');
  console.log(`   Customers: ${totalCustomers}`);
  console.log(`   Mechanics: ${totalMechanics}`);
  console.log(`   Bookings:  ${totalBookings}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
