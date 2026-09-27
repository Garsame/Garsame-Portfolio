import { Member, Message, newUnsubToken } from "../models";

const log = (line: string) => console.log(`  ${line}`);

export async function seedMembersAndMessages() {
  const memberCount = await Member.countDocuments();
  if (memberCount === 0) {
    const sampleMembers = [
      {
        firstName: "Amina",
        lastName: "Yusuf",
        email: "amina.y@example.com",
        status: "active" as const,
        source: "home" as const,
        joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        unsubToken: newUnsubToken(),
      },
      {
        firstName: "Ibrahim",
        lastName: "Ahmed",
        email: "ibrahim@heelan.so",
        status: "active" as const,
        source: "blog" as const,
        joinedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        unsubToken: newUnsubToken(),
      },
      {
        firstName: "Faduma",
        lastName: "Hassan",
        email: "f.hassan@example.com",
        status: "active" as const,
        source: "membership" as const,
        joinedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        unsubToken: newUnsubToken(),
      },
      {
        firstName: "Mohamed",
        lastName: "Ali",
        email: "m.ali@mgh.so",
        status: "active" as const,
        source: "footer" as const,
        joinedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
        unsubToken: newUnsubToken(),
      },
      {
        firstName: "Sagal",
        lastName: "Omar",
        email: "sagal@example.com",
        status: "unsubscribed" as const,
        source: "blog" as const,
        joinedAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
        unsubscribedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        unsubToken: newUnsubToken(),
      },
      {
        firstName: "Abdirahim",
        lastName: "Iftin",
        email: "iftin@example.com",
        status: "active" as const,
        source: "home" as const,
        joinedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
        unsubToken: newUnsubToken(),
      },
    ];

    await Member.insertMany(sampleMembers);
    log(`members    created ${sampleMembers.length} sample members`);
  } else {
    log(`members    exist (${memberCount}) — left unchanged`);
  }

  const messageCount = await Message.countDocuments();
  if (messageCount === 0) {
    const sampleMessages = [
      {
        name: "Yusuf Warsame",
        email: "yusuf@carshi.so",
        business: "Carshi Restaurant",
        need: "Website",
        message:
          "We want customers to order for delivery without calling. Right now one person answers the phone all evening and still misses orders, and on Fridays it is impossible. We also want the menu online so we stop printing it every time a price changes.\n\nI saw the work you did for the bus union. Is this something you take on, and roughly what would it cost? We are not a big place — twelve staff.",
        read: false,
        archived: false,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        name: "Halima Nur",
        email: "halima@nurpharmacy.so",
        business: "Nur Pharmacy",
        need: "Operations system",
        message:
          "Stock is counted by hand every evening and it never matches what was sold. We need a simple web-based inventory ledger that our cashiers can use across 3 branch locations.",
        read: false,
        archived: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        name: "Abdi Jama",
        email: "abdi@jamalogistics.so",
        business: "Jama Logistics",
        need: "Not sure yet",
        message:
          "A friend told me you built the bus system. We have a similar fleet dispatch tracking problem. Would love to have a 15-minute call to explain our workflow.",
        read: false,
        archived: false,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
      {
        name: "Sahra Ali",
        email: "sahra@freelance.so",
        business: "Freelance",
        need: "Mobile app",
        message:
          "Read your article about mobile money integrations in Somalia. Wanted to ask if you offer architectural consulting for fintech integrations.",
        read: true,
        archived: false,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        name: "Hodan Farah",
        email: "hodan@tailoring.so",
        business: "Hodan Tailoring",
        need: "Website",
        message:
          "Do you build small portfolio sites for bespoke tailoring businesses? Looking for a clean showcase of our traditional outfits.",
        read: true,
        archived: true,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
    ];

    await Message.insertMany(sampleMessages);
    log(`messages   created ${sampleMessages.length} sample messages`);
  } else {
    log(`messages   exist (${messageCount}) — left unchanged`);
  }
}
