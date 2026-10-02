import { Link } from "react-router-dom";

function Home() {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-block rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
            Smart Venue & Event Booking
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-6xl">
            Find your space.
            <span className="block text-indigo-600">
              Book your slot.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Discover and reserve venues for your next event.
            SlotLock makes checking availability and managing
            bookings simple.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Get Started
            </Link>

            <Link
              to="/login"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Sign In
            </Link>

            <Link
              to="/resources"
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Explore Venues
            </Link>

          </div>
        </div>

        <div className="rounded-3xl bg-indigo-600 p-8 text-white shadow-xl md:p-12">
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-200">
            Welcome to SlotLock
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            Your next event starts here.
          </h2>

          <p className="mt-4 leading-7 text-indigo-100">
            Explore bookable spaces, check available time slots,
            and manage your reservations in one place.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-2xl font-bold">01</p>
              <p className="mt-1 text-sm text-indigo-100">
                Find a venue
              </p>
            </div>

            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-2xl font-bold">02</p>
              <p className="mt-1 text-sm text-indigo-100">
                Reserve a slot
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Everything you need to book
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Feature
              title="Explore Venues"
              description="Browse available venues and find a space suited to your event."
            />

            <Feature
              title="Check Availability"
              description="View available dates and time slots before making a booking."
            />

            <Feature
              title="Manage Bookings"
              description="Keep track of your reservations from one place."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ title, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-600">
        ✓
      </div>

      <h3 className="text-xl font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-slate-600">
        {description}
      </p>
    </div>
  );
}

export default Home;