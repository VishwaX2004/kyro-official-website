"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

import MediaUpload from "@/app/components/MediaUpload";

type Resource = "overview" | "users" | "products" | "orders" | "settings";

type RecordItem = {
  _id: string;
  [key: string]: unknown;
};

type CollectionResource = "users" | "products" | "orders";

type Profile = {
  name: string;
  email: string;
  imageUrl?: string;
};

/* =========================================================
   SIDEBAR ICONS
========================================================= */

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const icons = {
  overview: (
    <Svg>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </Svg>
  ),

  users: (
    <Svg>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </Svg>
  ),

  products: (
    <Svg>
      <path d="M9 3h6v4H9z" />
      <path d="M7 7h10l2 4v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9z" />
    </Svg>
  ),

  orders: (
    <Svg>
      <path d="M3 7l9-4 9 4-9 4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </Svg>
  ),

  settings: (
    <Svg>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Svg>
  ),

  back: (
    <Svg>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </Svg>
  ),
};

const navItems: {
  id: Resource;
  label: string;
  icon: ReactNode;
}[] = [
  {
    id: "overview",
    label: "Overview",
    icon: icons.overview,
  },
  {
    id: "users",
    label: "Customers",
    icon: icons.users,
  },
  {
    id: "products",
    label: "Fragrances",
    icon: icons.products,
  },
  {
    id: "orders",
    label: "Orders",
    icon: icons.orders,
  },
];

/* =========================================================
   EMPTY FORMS
========================================================= */

const emptyForms = {
  users: {
    name: "",
    username: "",
    email: "",
    password: "",
    role: "customer",
    imageUrl: "",
    phone: "",
    address: "",
  },

  products: {
    name: "",
    brand: "",
    category: "Men",
    type: "Eau de Parfum",

    description: "",
    shortDescription: "",

    gender: "Men",
    concentration: "Eau de Parfum",

    longevity: "",
    sillage: "Moderate",

    season: [],
    occasion: [],

    topNotes: "",
    middleNotes: "",
    baseNotes: "",

    decant5Enabled: "true",
    decant5LabelledPrice: "",
    decant5Price: "",
    decant5Stock: "0",

    decant10Enabled: "true",
    decant10LabelledPrice: "",
    decant10Price: "",
    decant10Stock: "0",

    isFeatured: "false",
    isBestSeller: "false",
    isActive: "true",
  },

  orders: {
    customer: "",
    items: "1",
    total: "",
    status: "pending",
  },
};

/* =========================================================
   ADMIN PAGE
========================================================= */

export default function AdminPage() {
  const [resource, setResource] = useState<Resource>("overview");

  const [records, setRecords] = useState<RecordItem[]>([]);

  const [counts, setCounts] = useState({
    users: 0,
    products: 0,
    orders: 0,
  });

  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [editing, setEditing] = useState<RecordItem | null>(null);

  const [query, setQuery] = useState("");

  const [notice, setNotice] = useState("");

  const [profile, setProfile] = useState<Profile>({
    name: "Kyro Admin",
    email: "admin@kyroparfums.com",
    imageUrl: "",
  });

  const collection: CollectionResource | null =
    resource === "users" ||
    resource === "products" ||
    resource === "orders"
      ? resource
      : null;

  /* =====================================================
     LOAD DATA
  ===================================================== */

  const loadData = useCallback(
    async (target: Resource = resource) => {
      if (
        target !== "users" &&
        target !== "products" &&
        target !== "orders"
      ) {
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(`/api/admin/${target}`);

        const data = (await response.json()) as {
          records?: RecordItem[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load records."
          );
        }

        setRecords(data.records ?? []);
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "Unable to load records."
        );
      } finally {
        setLoading(false);
      }
    },
    [resource]
  );

  /* =====================================================
     LOAD COUNTS
  ===================================================== */

  useEffect(() => {
    async function loadCounts() {
      try {
        const results = await Promise.all(
          (
            ["users", "products", "orders"] as CollectionResource[]
          ).map(async (item) => {
            const response = await fetch(`/api/admin/${item}`);

            if (!response.ok) {
              throw new Error(`Unable to load ${item}.`);
            }

            const data = (await response.json()) as {
              records?: RecordItem[];
            };

            return [item, data.records?.length ?? 0] as const;
          })
        );

        setCounts({
          users:
            results.find(([key]) => key === "users")?.[1] ?? 0,

          products:
            results.find(([key]) => key === "products")?.[1] ?? 0,

          orders:
            results.find(([key]) => key === "orders")?.[1] ?? 0,
        });
      } catch {
        setNotice(
          "Some dashboard data could not be loaded."
        );
      }
    }

    loadCounts();
  }, []);

  /* =====================================================
     LOAD COLLECTION
  ===================================================== */

  useEffect(() => {
    if (collection) {
      loadData(resource);
    } else {
      setRecords([]);
    }

    setQuery("");
    setShowForm(false);
    setEditing(null);
  }, [resource, collection, loadData]);

  /* =====================================================
     SEARCH
  ===================================================== */

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return records;
    }

    return records.filter((record) =>
      JSON.stringify(record)
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [records, query]);

  function selectResource(next: Resource) {
    setResource(next);
    setNotice("");
  }

  /* =====================================================
     SAVE RECORD
  ===================================================== */

  async function saveRecord(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!collection) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    let payload: Record<string, unknown>;

    /* ===================================================
       PRODUCT PAYLOAD
    =================================================== */

    if (collection === "products") {
      const getString = (name: string) =>
        String(formData.get(name) ?? "").trim();

      const getNumber = (name: string) =>
        Number(formData.get(name) ?? 0);

      const getList = (name: string) =>
        formData
          .getAll(name)
          .map((item) => String(item).trim())
          .filter(Boolean);

      // Every uploaded image is submitted with the same `images` name.
      // FormData.getAll() lets the admin add as many images as needed.
      const images = formData
        .getAll("images")
        .map((item) => String(item).trim())
        .filter(Boolean);

      /* -----------------------------------------------
         DECANTS
      ------------------------------------------------ */

      const decants: Array<{
        size: number;
        unit: "ml";
        labelledPrice: number;
        price: number;
        stock: number;
      }> = [];

      /* 5ml */

      if (formData.get("decant5Enabled") === "on") {
        const labelledPrice = getNumber(
          "decant5LabelledPrice"
        );

        const price = getNumber("decant5Price");

        const stock = getNumber("decant5Stock");

        if (price <= 0) {
          setNotice(
            "Please enter a valid 5ml selling price."
          );
          return;
        }

        if (labelledPrice <= 0) {
          setNotice(
            "Please enter a valid 5ml labelled price."
          );
          return;
        }

        if (price > labelledPrice) {
          setNotice(
            "5ml selling price cannot be higher than the labelled price."
          );
          return;
        }

        decants.push({
          size: 5,
          unit: "ml",
          labelledPrice,
          price,
          stock: Math.max(0, stock),
        });
      }

      /* 10ml */

      if (formData.get("decant10Enabled") === "on") {
        const labelledPrice = getNumber(
          "decant10LabelledPrice"
        );

        const price = getNumber("decant10Price");

        const stock = getNumber("decant10Stock");

        if (price <= 0) {
          setNotice(
            "Please enter a valid 10ml selling price."
          );
          return;
        }

        if (labelledPrice <= 0) {
          setNotice(
            "Please enter a valid 10ml labelled price."
          );
          return;
        }

        if (price > labelledPrice) {
          setNotice(
            "10ml selling price cannot be higher than the labelled price."
          );
          return;
        }

        decants.push({
          size: 10,
          unit: "ml",
          labelledPrice,
          price,
          stock: Math.max(0, stock),
        });
      }

      /* -----------------------------------------------
         VALIDATION
      ------------------------------------------------ */

      if (!getString("name")) {
        setNotice("Please enter the perfume name.");
        return;
      }

      if (!getString("brand")) {
        setNotice(
          "Please enter the perfume brand."
        );
        return;
      }

      if (images.length === 0) {
        setNotice(
          "Please upload at least one perfume image."
        );
        return;
      }

      if (decants.length === 0) {
        setNotice(
          "Select at least one decant size: 5ml or 10ml."
        );
        return;
      }

      /* -----------------------------------------------
         EXISTING PRODUCT DATA
      ------------------------------------------------ */

      const existingRating = editing
        ? Number(editing.rating ?? 0)
        : 0;

      const existingReviewCount = editing
        ? Number(editing.reviewCount ?? 0)
        : 0;

      const createdAt =
        editing?.createdAt ??
        new Date().toISOString();

      /* -----------------------------------------------
         EXACT PRODUCT STRUCTURE
      ------------------------------------------------ */

      payload = {
        name: getString("name"),

        slug: createSlug(
          getString("name")
        ),

        brand: getString("brand"),

        category: getString("category"),

        type: getString("type"),

        description:
          getString("description"),

        shortDescription:
          getString("shortDescription"),

        images,

        decants,

        fragrance: {
          gender: getString("gender"),

          concentration:
            getString("concentration"),

          season: getList("season"),

          occasion: getList("occasion"),

          longevity:
            getString("longevity"),

          sillage:
            getString("sillage"),
        },

        notes: {
          top: splitNotes(
            getString("topNotes")
          ),

          middle: splitNotes(
            getString("middleNotes")
          ),

          base: splitNotes(
            getString("baseNotes")
          ),
        },

        isFeatured:
          formData.get("isFeatured") === "on",

        isBestSeller:
          formData.get("isBestSeller") === "on",

        isActive:
          formData.get("isActive") === "on",

        rating: existingRating,

        reviewCount: existingReviewCount,

        createdAt,

        updatedAt:
          new Date().toISOString(),
      };
    } else if (collection === "users") {
      /* =================================================
         USER PAYLOAD
         Exact MongoDB user structure
      ================================================= */

      const getUserString = (name: string) =>
        String(formData.get(name) ?? "").trim();

      const existingCreatedAt =
        editing?.createdAt
          ? String(editing.createdAt)
          : new Date().toISOString();

      const password = getUserString("password");

      payload = {
        name: getUserString("name"),
        username: getUserString("username"),
        email: getUserString("email"),
        role: getUserString("role") || "customer",
        imageUrl: getUserString("imageUrl"),
        phone: getUserString("phone"),
        address: getUserString("address"),
        createdAt: existingCreatedAt,
        updatedAt: new Date().toISOString(),
      };

      if (!editing || password) {
        payload.password = password;
      }

      if (!getUserString("name")) {
        setNotice("Please enter the customer's full name.");
        return;
      }

      if (!getUserString("username")) {
        setNotice("Please enter a username.");
        return;
      }

      if (!getUserString("email")) {
        setNotice("Please enter the customer's email address.");
        return;
      }

      if (!editing && !password) {
        setNotice("Please enter a password for the new customer.");
        return;
      }

      if (password && password.length < 6) {
        setNotice("Password must contain at least 6 characters.");
        return;
      }
    } else if (collection === "orders") {
      /* =================================================
         ORDERS — only status is editable via admin UI
      ================================================= */

      const statusValue = formData.get("status");
      if (!statusValue) {
        setNotice("Please select a status.");
        return;
      }

      payload = { status: String(statusValue) };

    } else {
      /* =================================================
         USERS
      ================================================= */

      payload = Object.fromEntries(
        formData.entries()
      );
    }

    /* ===================================================
       SEND REQUEST
    ================================================= */

    try {
      const url = editing
        ? `/api/admin/${collection}/${editing._id}`
        : `/api/admin/${collection}`;

      const response = await fetch(url, {
        method: editing ? "PATCH" : "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save record."
        );
      }

      setNotice(
        collection === "orders"
          ? `Order status updated to "${payload.status}".`
          : editing
          ? "Fragrance updated successfully."
          : "Fragrance added to the collection."
      );

      toast.success(
        collection === "orders"
          ? `Order status updated to "${payload.status}".`
          : editing
          ? "Fragrance updated successfully."
          : "Fragrance added to the collection."
      );

      setShowForm(false);

      setEditing(null);

      await loadData();

      if (!editing) {
        setCounts((current) => ({
          ...current,
          [collection]:
            current[collection] + 1,
        }));
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to save record."
      );
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save record.",
        { duration: 6000 }
      );
    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function removeRecord(id: string) {
    if (!collection) {
      return;
    }

    const confirmed = window.confirm(
      "Remove this record from Kyro?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/${collection}/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to remove that record."
        );
      }

      setRecords((current) =>
        current.filter(
          (record) => record._id !== id
        )
      );

      setCounts((current) => ({
        ...current,
        [collection]: Math.max(
          0,
          current[collection] - 1
        ),
      }));

      setNotice("Record removed.");
      toast.success("Record removed.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to remove that record."
      );
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to remove that record.",
        { duration: 6000 }
      );
    }
  }

  /* =====================================================
     PROFILE
  ===================================================== */

  async function saveProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const next = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      imageUrl: String(formData.get("imageUrl") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    };
    if (!next.name || !next.email) {
      setNotice("Enter your name and email address.");
      return;
    }
    if (next.password && next.password.length < 6) {
      setNotice("Password must contain at least 6 characters.");
      return;
    }
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: next.name,
          email: next.email,
          imageUrl: next.imageUrl,
          ...(next.password ? { password: next.password } : {}),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(data.message || "Unable to save profile.");
      setProfile({ name: next.name, email: next.email, imageUrl: next.imageUrl });
      form.reset();
      setNotice("Admin profile updated successfully.");
      toast.success("Admin profile updated successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save profile.");
      toast.error(
        error instanceof Error ? error.message : "Unable to save profile.",
        { duration: 6000 }
      );
    }
  }

  const titles: Record<
    CollectionResource,
    string
  > = {
    users: "Customers",
    products: "Fragrances",
    orders: "Orders",
  };

  return (
    <main className="admin-shell kyro-admin">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="admin-sidebar">

        <div className="sidebar-top">
          <Link
            className="admin-brand"
            href="/"
            aria-label="Kyro Parfums home"
          >
            <Image
              className="admin-logo"
              src="/logo.png"
              alt="Kyro Parfums"
              width={126}
              height={76}
              priority
            />
          </Link>
        </div>

        <span className="admin-section-label">
          Workspace
        </span>

        <nav
          className="admin-nav"
          aria-label="Workspace"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                resource === item.id
                  ? "active"
                  : ""
              }
              onClick={() =>
                selectResource(item.id)
              }
              aria-label={item.label}
              aria-current={
                resource === item.id
                  ? "page"
                  : undefined
              }
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span className="nav-label">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">

          <button
            type="button"
            className={
              resource === "settings"
                ? "active"
                : ""
            }
            onClick={() =>
              selectResource("settings")
            }
            aria-label="Settings"
          >
            <span className="nav-icon">
              {icons.settings}
            </span>

            <span className="nav-label">
              Settings
            </span>
          </button>

          <Link
            href="/"
            aria-label="Go back to the Kyro Parfums homepage"
          >
            <span className="nav-icon">
              {icons.back}
            </span>

            <span className="nav-label">
              Back to homepage
            </span>
          </Link>

        </div>

        <div className="admin-user-mini">

          <button
            type="button"
            className="avatar"
            onClick={() =>
              selectResource("settings")
            }
            aria-label="Open profile settings"
          >
            {profile.name.slice(0, 1)}
          </button>

          <span className="mini-user-info">
            <strong>
              {profile.name}
            </strong>

            <small>
              Administrator
            </small>
          </span>

        </div>

      </aside>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="admin-content">

        <header className="admin-header">

          <div className="header-copy">

            <p className="admin-kicker">
              KYRO PARFUMS / HOUSE CONTROL
            </p>

            <h1>
              {resource === "overview"
                ? "Shape the next signature."
                : resource === "settings"
                ? "Make the house yours."
                : titles[resource]}
            </h1>

            <p className="header-subtitle">
              {resource === "overview"
                ? "A quiet space to manage the fragrance house."
                : resource === "products"
                ? "Curate the collection with intention."
                : resource === "users"
                ? "Know the collectors behind Kyro."
                : resource === "orders"
                ? "Keep every fragrance journey moving."
                : "Personalise your Kyro workspace."}
            </p>

          </div>

          <div className="admin-header-actions">

            <span className="live-pill">
              <i />
              Storefront live
            </span>

            <button
              type="button"
              className="admin-icon-button"
              onClick={() =>
                setNotice(
                  "Your house is up to date."
                )
              }
              aria-label="Check store status"
            >
              ♢
            </button>

            <button
              type="button"
              className="admin-avatar"
              onClick={() =>
                selectResource("settings")
              }
              aria-label="Open settings"
            >
              {profile.name.slice(0, 1)}
            </button>

          </div>

        </header>

        {/* NOTICE */}

        {notice && (
          <div
            className="admin-notice"
            role="status"
          >
            <span className="notice-symbol">
              ✓
            </span>

            <span>
              {notice}
            </span>

            <button
              type="button"
              onClick={() =>
                setNotice("")
              }
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        {/* OVERVIEW */}

        {resource === "overview" && (
          <Overview
            counts={counts}
            onNavigate={selectResource}
          />
        )}

        {/* SETTINGS */}

        {resource === "settings" && (
          <Settings
            profile={profile}
            onSave={saveProfile}
          />
        )}

        {/* COLLECTION */}

        {collection && (
          <Collection
            resource={collection}
            records={visibleRecords}
            query={query}
            setQuery={setQuery}
            loading={loading}
            onAdd={() => {
              setEditing(null);
              setShowForm(true);
            }}
            onEdit={(record) => {
              setEditing(record);
              setShowForm(true);
            }}
            onDelete={removeRecord}
          />
        )}

        {/* MODAL */}

        {showForm && collection && (
          <RecordModal
            collection={collection}
            editing={editing}
            onClose={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSubmit={saveRecord}
          />
        )}

      </section>

      {/* =================================================
          STYLES
      ================================================= */}

      <style
        dangerouslySetInnerHTML={{
          __html: `
:root{
  --kyro-ivory:#f8f6f0;
  --kyro-white:#fffefa;
  --kyro-black:#171717;
  --kyro-gold:#8f6d36;
  --kyro-gold-light:#d0ad70;
  --kyro-line:rgba(23,23,23,.12);
  --kyro-text:rgba(23,23,23,.78);
  --kyro-muted:rgba(23,23,23,.58);
  --rail:224px;
}

html,
body{
  margin:0;
  max-width:100%;
  overflow-x:hidden;
}

.kyro-admin{
  min-height:100vh;
  background:
    radial-gradient(
      circle at 85% 5%,
      rgba(208,173,112,.10),
      transparent 25%
    ),
    var(--kyro-ivory);
  color:var(--kyro-black);
  font-family:inherit;
  font-size:14px;
}

.kyro-admin *{
  box-sizing:border-box;
}

.kyro-admin button{
  font-family:inherit;
}

/* SIDEBAR */

.kyro-admin .admin-sidebar{
  position:fixed;
  top:0;
  left:0;
  bottom:0;
  z-index:50;
  width:var(--rail);
  height:100vh;
  height:100dvh;
  display:flex;
  flex-direction:column;
  padding:18px 14px 14px;
  background:#171717;
  color:#fff;
  border-right:1px solid rgba(255,255,255,.06);
  overflow-y:auto;
  overflow-x:hidden;
  scrollbar-width:none;
}

.kyro-admin .admin-sidebar::-webkit-scrollbar{
  display:none;
}

.sidebar-top{
  width:100%;
  padding:0 8px 14px;
  border-bottom:1px solid rgba(255,255,255,.09);
}

.kyro-admin .admin-brand{
  display:flex;
  align-items:center;
  width:fit-content;
}

.kyro-admin .admin-logo{
  width:88px;
  height:auto;
  object-fit:contain;
  filter:brightness(0) invert(1);
}

.admin-section-label{
  display:block;
  margin:18px 12px 8px;
  color:rgba(255,255,255,.55);
  font-size:10px;
  font-weight:700;
  letter-spacing:.14em;
  text-transform:uppercase;
}

.kyro-admin .admin-nav,
.admin-sidebar-bottom{
  display:flex;
  flex-direction:column;
  gap:4px;
  width:100%;
}

.admin-sidebar-bottom{
  margin-top:auto;
  padding-top:12px;
  border-top:1px solid rgba(255,255,255,.09);
}

.kyro-admin .admin-nav button,
.kyro-admin .admin-sidebar-bottom button,
.kyro-admin .admin-sidebar-bottom a{
  position:relative;
  display:flex;
  align-items:center;
  gap:12px;
  width:100%;
  height:40px;
  padding:0 12px;
  border:0;
  border-radius:10px;
  background:transparent;
  color:rgba(255,255,255,.85);
  font-size:13px;
  font-weight:600;
  text-align:left;
  text-decoration:none;
  cursor:pointer;
  transition:
    background .25s ease,
    color .25s ease;
}

.kyro-admin .admin-nav button:hover,
.kyro-admin .admin-sidebar-bottom button:hover,
.kyro-admin .admin-sidebar-bottom a:hover{
  background:rgba(255,255,255,.10);
  color:#fff;
}

.kyro-admin .admin-nav button.active,
.kyro-admin .admin-sidebar-bottom button.active{
  background:
    linear-gradient(
      135deg,
      #d0ad70,
      #a98748
    );
  color:#171717;
  box-shadow:
    0 8px 22px
    rgba(208,173,112,.25);
}

.nav-icon{
  display:flex;
  align-items:center;
  justify-content:center;
  flex:0 0 20px;
  width:20px;
}

.nav-label{
  flex:1;
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.kyro-admin .admin-user-mini{
  display:flex;
  align-items:center;
  gap:10px;
  margin-top:12px;
  padding:9px;
  border:1px solid rgba(255,255,255,.12);
  border-radius:12px;
  background:rgba(255,255,255,.06);
}

.kyro-admin .avatar{
  display:flex;
  align-items:center;
  justify-content:center;
  flex:0 0 34px;
  width:34px;
  height:34px;
  border:0;
  border-radius:10px;
  background:
    linear-gradient(
      135deg,
      #d0ad70,
      #967340
    );
  color:#171717;
  font-family:Georgia,serif;
  font-size:15px;
  font-weight:700;
  cursor:pointer;
}

.mini-user-info{
  display:block;
  min-width:0;
  flex:1;
}

.mini-user-info strong,
.mini-user-info small{
  display:block;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.mini-user-info strong{
  color:#fff;
  font-size:12px;
}

.mini-user-info small{
  margin-top:2px;
  color:rgba(255,255,255,.65);
  font-size:11px;
}

/* CONTENT */

.kyro-admin .admin-content{
  min-height:100vh;
  margin-left:var(--rail);
  padding:
    34px
    clamp(18px,3.5vw,56px)
    60px;
}

.kyro-admin .admin-header{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:24px;
  max-width:1480px;
  margin:0 auto;
  padding-bottom:24px;
  border-bottom:1px solid var(--kyro-line);
}

.kyro-admin .admin-kicker{
  display:block;
  color:var(--kyro-gold);
  font-size:11px;
  font-weight:800;
  letter-spacing:.18em;
  line-height:1.4;
}

.kyro-admin .admin-header h1{
  margin:10px 0 0;
  font-family:Georgia,"Times New Roman",serif;
  font-size:clamp(30px,3.6vw,52px);
  font-weight:400;
  line-height:1.02;
  letter-spacing:-.04em;
}

.header-subtitle{
  max-width:520px;
  margin:10px 0 0;
  color:var(--kyro-muted);
  font-size:14px;
  line-height:1.6;
}

.admin-header-actions{
  display:flex;
  align-items:center;
  gap:10px;
  flex-shrink:0;
}

.live-pill{
  display:inline-flex;
  align-items:center;
  gap:8px;
  height:38px;
  padding:0 15px;
  border:1px solid var(--kyro-line);
  border-radius:999px;
  background:rgba(255,255,255,.7);
  color:var(--kyro-text);
  font-size:12px;
  font-weight:700;
}

.live-pill i{
  width:8px;
  height:8px;
  border-radius:999px;
  background:#4f8a4c;
}

.admin-icon-button,
.admin-avatar{
  display:flex;
  align-items:center;
  justify-content:center;
  border:1px solid var(--kyro-line);
  cursor:pointer;
}

.admin-icon-button{
  width:38px;
  height:38px;
  border-radius:50%;
  background:#fff;
}

.admin-avatar{
  width:40px;
  height:40px;
  border-radius:13px;
  background:#171717;
  color:#d0ad70;
  border-color:transparent;
}

/* NOTICE */

.kyro-admin .admin-notice{
  display:flex;
  align-items:center;
  gap:12px;
  max-width:1480px;
  margin:18px auto 0;
  padding:13px 16px;
  border:1px solid rgba(143,109,54,.3);
  border-radius:14px;
  background:#fffaf0;
}

.notice-symbol{
  display:flex;
  align-items:center;
  justify-content:center;
  width:24px;
  height:24px;
  border-radius:50%;
  background:rgba(143,109,54,.16);
  color:var(--kyro-gold);
}

.admin-notice button{
  margin-left:auto;
  border:0;
  background:transparent;
  font-size:22px;
  cursor:pointer;
}

/* OVERVIEW */

.overview{
  max-width:1480px;
  margin:26px auto 0;
}

.welcome-card{
  position:relative;
  min-height:250px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:30px;
  overflow:hidden;
  padding:clamp(26px,4vw,52px);
  border:1px solid var(--kyro-line);
  border-radius:26px;
  background:#fffefa;
  box-shadow:
    0 20px 60px
    rgba(23,23,23,.06);
}

.welcome-card h2{
  max-width:680px;
  margin:14px 0 0;
  font-family:Georgia,serif;
  font-size:clamp(28px,3.6vw,50px);
  font-weight:400;
  line-height:1.02;
}

.welcome-card p{
  max-width:520px;
  margin:16px 0 0;
  color:var(--kyro-muted);
  font-size:15px;
  line-height:1.7;
}

.welcome-bottle{
  position:relative;
  flex:0 0 145px;
  width:145px;
  height:185px;
}

.welcome-bottle>div{
  position:absolute;
  width:75px;
  height:118px;
  top:42px;
  left:35px;
  border-radius:16px 16px 20px 20px;
  background:
    linear-gradient(
      100deg,
      #8f754b,
      #e6d2a5 45%,
      #a7854d
    );
}

.welcome-bottle>div::before{
  content:"";
  position:absolute;
  width:34px;
  height:35px;
  left:50%;
  top:-28px;
  transform:translateX(-50%);
  border-radius:6px 6px 2px 2px;
  background:#1c1c1c;
}

.welcome-bottle span{
  position:relative;
  z-index:2;
  display:block;
  margin-top:82px;
  color:#fff;
  font-family:Georgia,serif;
  font-size:12px;
  letter-spacing:.18em;
  text-align:center;
}

.welcome-bottle small{
  font-size:7px;
}

.metric-grid{
  display:grid;
  grid-template-columns:
    repeat(3,minmax(0,1fr));
  gap:14px;
  margin-top:14px;
}

.metric-card{
  min-height:170px;
  padding:24px;
  border:1px solid var(--kyro-line);
  border-radius:22px;
  background:#fffefa;
  text-align:left;
  cursor:pointer;
  box-shadow:
    0 10px 34px
    rgba(23,23,23,.05);
}

.metric-card>span{
  display:block;
  color:var(--kyro-muted);
  font-size:12px;
  font-weight:700;
  letter-spacing:.1em;
  text-transform:uppercase;
}

.metric-card strong{
  display:block;
  margin-top:18px;
  font-family:Georgia,serif;
  font-size:48px;
  font-weight:400;
}

.metric-card small{
  display:block;
  margin-top:12px;
  color:#7a5b2c;
}

.metric-card i{
  float:right;
  font-style:normal;
}

.overview-grid{
  display:grid;
  grid-template-columns:1.4fr .6fr;
  gap:14px;
  margin-top:14px;
}

.panel-card{
  min-height:260px;
  padding:26px;
  border:1px solid var(--kyro-line);
  border-radius:24px;
  background:#fffefa;
}

.panel-heading{
  display:flex;
  justify-content:space-between;
}

.panel-heading h3{
  margin:8px 0 0;
  font-family:Georgia,serif;
  font-size:26px;
  font-weight:400;
}

.quick-grid{
  display:grid;
  grid-template-columns:
    repeat(3,1fr);
  gap:10px;
  margin-top:24px;
}

.quick-grid button{
  min-height:128px;
  padding:16px;
  border:1px solid var(--kyro-line);
  border-radius:16px;
  background:#f8f6f0;
  text-align:left;
  cursor:pointer;
}

.quick-grid b{
  display:flex;
  align-items:center;
  justify-content:center;
  width:34px;
  height:34px;
  margin-bottom:14px;
  border-radius:10px;
  background:#171717;
  color:#d0ad70;
}

.quick-grid span,
.quick-grid small{
  display:block;
}

.quick-grid span{
  font-weight:700;
}

.quick-grid small{
  margin-top:5px;
  color:var(--kyro-muted);
}

.inspiration-card{
  background:#171717;
  color:#fff;
}

.inspiration-card .admin-kicker{
  color:#d0ad70;
}

.inspiration-card p{
  max-width:320px;
  margin-top:18px;
  font-family:Georgia,serif;
  font-size:22px;
  line-height:1.25;
}

/* COLLECTION */

.collection{
  max-width:1480px;
  margin:26px auto 0;
}

.collection-toolbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
  margin-bottom:14px;
}

.search-box{
  display:flex;
  align-items:center;
  gap:10px;
  width:min(440px,100%);
  height:48px;
  padding:0 16px;
  border:1px solid rgba(23,23,23,.16);
  border-radius:14px;
  background:#fffefa;
}

.search-box input{
  width:100%;
  border:0;
  outline:0;
  background:transparent;
}

.primary-action{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  min-height:46px;
  padding:0 22px;
  border:0;
  border-radius:999px;
  background:#171717!important;
  color:#fffefa!important;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
}

.primary-action:disabled{
  opacity:.6;
  cursor:not-allowed;
}

.table-card{
  overflow:hidden;
  border:1px solid var(--kyro-line);
  border-radius:22px;
  background:#fffefa;
}

.table-scroll{
  width:100%;
  overflow-x:auto;
}

.table-card table{
  width:100%;
  min-width:720px;
  border-collapse:collapse;
}

.table-card th{
  padding:15px 20px;
  border-bottom:1px solid var(--kyro-line);
  background:#f4f0e6;
  font-size:11px;
  text-align:left;
  text-transform:uppercase;
}

.table-card td{
  padding:16px 20px;
  border-bottom:1px solid rgba(23,23,23,.08);
  vertical-align:middle;
}

.cell-flex{
  display:flex;
  align-items:center;
  gap:13px;
}

.table-avatar{
  display:flex;
  align-items:center;
  justify-content:center;
  width:38px;
  height:38px;
  border-radius:12px;
  background:#171717;
  color:#d0ad70;
}

.product-thumb{
  display:inline-block;
  width:48px;
  height:56px;
  flex:0 0 48px;
  border-radius:10px;
  background-position:center;
  background-size:cover;
  background-color:#ede7d9;
}

.tag{
  display:inline-flex;
  align-items:center;
  min-height:28px;
  padding:0 12px;
  border-radius:999px;
  background:rgba(143,109,54,.1);
  color:#6f5226;
  font-size:12px;
  font-weight:700;
}

.price{
  font-weight:700;
}

.stock{
  display:inline-flex;
  padding:6px 10px;
  border-radius:999px;
  background:rgba(79,121,72,.12);
  color:#3c6a35;
  font-size:12px;
  font-weight:700;
}

.stock.low{
  background:rgba(164,76,54,.12);
  color:#9a3f2a;
}

.order-status{
  display:inline-flex;
  padding:6px 12px;
  border-radius:999px;
  background:rgba(23,23,23,.08);
  font-size:12px;
  font-weight:700;
  text-transform:capitalize;
}

.order-status.paid,
.order-status.completed{
  background:rgba(79,121,72,.14);
  color:#3c6a35;
}

.order-status.shipped{
  background:rgba(52,98,150,.12);
  color:#2c5584;
}

.order-status.pending{
  background:rgba(170,137,83,.18);
  color:#7a5518;
}

.order-status.cancelled{
  background:rgba(160,66,50,.12);
  color:#9a3a2c;
}

.row-actions{
  white-space:nowrap;
  text-align:right;
}

.row-actions button{
  margin-left:8px;
  padding:8px 14px;
  border:1px solid rgba(23,23,23,.18);
  border-radius:10px;
  background:#fff;
  color:#171717;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
}

.row-actions button:last-child{
  color:#9a3a2c;
  border-color:rgba(160,66,50,.35);
}

.empty-state{
  height:180px;
  color:var(--kyro-muted)!important;
  text-align:center;
}

/* MODAL */

.modal-backdrop{
  position:fixed;
  inset:0;
  z-index:200;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:20px;
  background:rgba(15,14,13,.62);
  backdrop-filter:blur(10px);
}

.record-modal{
  position:relative;
  width:min(980px,100%);
  max-height:
    calc(100dvh - 40px);
  overflow:hidden;
  border-radius:26px;
  background:#fffefa;
  box-shadow:
    0 40px 110px
    rgba(0,0,0,.3);
}

.record-modal-scrollable{
  display:flex;
  flex-direction:column;
  height:100%;
}

.record-modal-header-fixed{
  flex:0 0 auto;
  padding:26px 30px 20px;
  border-bottom:1px solid var(--kyro-line);
  background:#fffefa;
}

.modal-close{
  position:absolute;
  top:20px;
  right:22px;
  width:36px;
  height:36px;
  border:1px solid rgba(23,23,23,.18);
  border-radius:50%;
  background:#fff;
  font-size:20px;
  cursor:pointer;
}

.record-modal-header-fixed h2{
  max-width:560px;
  margin:8px 50px 0 0;
  font-family:Georgia,serif;
  font-size:clamp(26px,3.6vw,38px);
  font-weight:400;
}

.record-modal-content{
  flex:1 1 auto;
  min-height:0;
  overflow-y:auto;
  padding:20px 24px 24px;
}

.record-modal-footer{
  flex:0 0 auto;
  display:flex;
  justify-content:flex-end;
  gap:8px;
  padding:16px 30px;
  border-top:1px solid var(--kyro-line);
  background:#f4f0e6;
}

.modal-cancel{
  min-height:46px;
  padding:0 20px;
  border:1px solid rgba(23,23,23,.25);
  border-radius:999px;
  background:#fff;
  color:#171717;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
}

/* PRODUCT FORM */

.perfume-form{
  display:flex;
  flex-direction:column;
  gap:16px;
}

.form-section-card{
  padding:22px;
  border:1px solid var(--kyro-line);
  border-radius:20px;
  background:#fffefa;
}

.form-section-heading{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:18px;
  margin-bottom:20px;
}

.form-section-heading h3{
  margin:6px 0 0;
  font-family:Georgia,serif;
  font-size:25px;
  font-weight:400;
}

.form-section-heading p{
  max-width:590px;
  margin:7px 0 0;
  color:var(--kyro-muted);
  font-size:12px;
  line-height:1.55;
}

.form-section-number{
  display:flex;
  align-items:center;
  justify-content:center;
  width:38px;
  height:38px;
  border-radius:12px;
  background:rgba(143,109,54,.08);
  color:var(--kyro-gold);
}

.form-grid-2{
  display:grid;
  grid-template-columns:
    repeat(2,minmax(0,1fr));
  gap:14px;
}

.notes-grid{
  display:grid;
  grid-template-columns:
    repeat(2,minmax(0,1fr));
  gap:14px;
}

.form-field{
  display:flex!important;
  flex-direction:column;
  gap:7px;
  margin-top:0!important;
}

.form-field.full-field{
  grid-column:1 / -1;
}

.form-field>span,
.field-mini-label,
.check-group-title{
  color:rgba(23,23,23,.68);
  font-size:10px;
  font-weight:800;
  letter-spacing:.1em;
  text-transform:uppercase;
}

.form-field input,
.form-field select,
.form-field textarea{
  width:100%;
  min-height:48px;
  padding:11px 13px;
  border:1px solid rgba(23,23,23,.17);
  border-radius:12px;
  outline:none;
  background:#fff;
  color:#171717;
  font:inherit;
  resize:vertical;
}

.form-field textarea{
  line-height:1.5;
}

.product-image-manager{
  display:flex;
  flex-direction:column;
  gap:16px;
}

.image-manager-intro{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px;
  padding:16px;
  border:1px solid rgba(143,109,54,.16);
  border-radius:16px;
  background:#faf8f2;
}

.image-manager-intro strong{
  display:block;
  font-size:14px;
}

.image-manager-intro p{
  margin:5px 0 0;
  max-width:620px;
  color:var(--kyro-muted);
  font-size:12px;
  line-height:1.55;
}

.image-count-badge{
  flex:0 0 auto;
  min-height:30px;
  display:inline-flex;
  align-items:center;
  padding:0 11px;
  border-radius:999px;
  background:#171717;
  color:#d0ad70;
  font-size:11px;
  font-weight:800;
}

.image-upload-list{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:12px;
}

.image-upload-card-modern{
  min-width:0;
  padding:15px;
  border:1px solid rgba(23,23,23,.12);
  border-radius:16px;
  background:#fff;
}

.image-card-top{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:10px;
  margin-bottom:12px;
}

.image-card-top small{
  display:block;
  margin-top:4px;
  color:var(--kyro-muted);
  font-size:11px;
}

.image-remove-button{
  flex:0 0 auto;
  border:0;
  background:transparent;
  color:#9a3a2c;
  font-size:11px;
  font-weight:800;
  cursor:pointer;
}

.add-image-button{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  min-height:48px;
  border:1px dashed rgba(143,109,54,.42);
  border-radius:14px;
  background:#faf8f2;
  color:#6f5226;
  font-size:12px;
  font-weight:800;
  cursor:pointer;
  transition:.2s ease;
}

.add-image-button:hover{
  background:#f4eee1;
  border-color:rgba(143,109,54,.7);
}

.add-image-button span{
  display:flex;
  align-items:center;
  justify-content:center;
  width:22px;
  height:22px;
  border-radius:50%;
  background:#171717;
  color:#d0ad70;
  font-size:17px;
  line-height:1;
}

.image-manager-help{
  margin:0;
  color:var(--kyro-muted);
  font-size:11px;
}

.image-upload-grid{
  display:grid;
  grid-template-columns:
    repeat(2,minmax(0,1fr));
  gap:14px;
}

.image-upload-card{
  padding:14px;
  border:1px dashed rgba(143,109,54,.32);
  border-radius:16px;
  background:#faf8f2;
}

.check-group+.check-group{
  margin-top:22px;
}

.check-grid{
  display:grid;
  grid-template-columns:
    repeat(4,minmax(0,1fr));
  gap:9px;
  margin-top:10px;
}

.check-card{
  position:relative;
  display:flex!important;
  align-items:center;
  gap:9px;
  min-height:48px;
  margin:0!important;
  padding:10px 12px;
  border:1px solid rgba(23,23,23,.12);
  border-radius:12px;
  background:#faf8f2;
  cursor:pointer;
}

.check-card input{
  position:absolute;
  opacity:0;
  pointer-events:none;
}

.custom-check{
  display:flex;
  align-items:center;
  justify-content:center;
  flex:0 0 19px;
  width:19px;
  height:19px;
  border:1px solid rgba(23,23,23,.25);
  border-radius:6px;
  background:#fff;
  color:transparent;
  font-size:11px;
  font-weight:900;
}

.check-card input:checked~.custom-check{
  border-color:#171717;
  background:#171717;
  color:#d0ad70;
}

.decant-options{
  display:grid;
  grid-template-columns:
    repeat(2,minmax(0,1fr));
  gap:14px;
}

.decant-card{
  padding:16px;
  border:1px solid rgba(23,23,23,.13);
  border-radius:16px;
  background:#faf8f2;
}

.decant-enable{
  position:relative;
  display:flex;
  align-items:center;
  gap:10px;
  margin:0!important;
  cursor:pointer;
}

.decant-enable input{
  position:absolute;
  opacity:0;
  pointer-events:none;
}

.decant-title{
  font-size:14px;
  font-weight:800;
}

.decant-fields{
  display:grid;
  grid-template-columns:
    1fr 1fr;
  gap:10px;
  margin-top:14px;
}

.decant-help{
  margin-top:12px;
  color:var(--kyro-muted);
  font-size:11px;
  line-height:1.5;
}

.visibility-grid{
  display:grid;
  grid-template-columns:
    repeat(3,minmax(0,1fr));
  gap:10px;
}

.toggle-card{
  align-items:flex-start;
  min-height:74px;
}

.toggle-card>span:last-child{
  display:flex;
  flex-direction:column;
  gap:4px;
}

.toggle-card strong{
  font-size:12px;
}

.toggle-card small{
  color:var(--kyro-muted);
  font-size:10px;
  line-height:1.4;
}

/* SIMPLE FORMS */

.simple-form-stack{
  display:flex;
  flex-direction:column;
  gap:4px;
}

.simple-form-stack label{
  display:block;
  margin-top:16px;
}

.simple-form-stack label>span{
  display:block;
  margin-bottom:7px;
  font-size:12px;
  font-weight:800;
  text-transform:uppercase;
}

.simple-form-stack input,
.simple-form-stack select{
  width:100%;
  min-height:48px;
  padding:0 14px;
  border:1px solid rgba(23,23,23,.18);
  border-radius:12px;
  background:#fff;
  color:#171717;
}

/* SETTINGS */

.settings-page{
  display:grid;
  grid-template-columns:.7fr 1.3fr;
  gap:15px;
  max-width:1050px;
  margin:26px auto 0;
}

.settings-card{
  border:1px solid var(--kyro-line);
  border-radius:24px;
  background:#fffefa;
}

.profile-card{
  min-height:400px;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  justify-content:center;
  padding:32px;
}

.large-avatar{
  display:flex;
  align-items:center;
  justify-content:center;
  width:76px;
  height:76px;
  margin-bottom:22px;
  border-radius:24px;
  background:#171717;
  color:#d0ad70;
  font-family:Georgia,serif;
  font-size:29px;
}

.profile-card h2{
  margin:10px 0 0;
  font-family:Georgia,serif;
  font-size:30px;
  font-weight:400;
}

.profile-card p{
  margin:8px 0 0;
  color:var(--kyro-muted);
}

.settings-form{
  display:flex;
  flex-direction:column;
  gap:16px;
  padding:32px;
}

.settings-form h3{
  margin:8px 0 0;
  font-family:Georgia,serif;
  font-size:28px;
  font-weight:400;
}

.settings-form label{
  display:flex;
  flex-direction:column;
  gap:8px;
  margin-top:4px;
  font-size:12px;
  font-weight:800;
  text-transform:uppercase;
}

.settings-form input{
  width:100%;
  height:50px;
  padding:0 14px;
  border:1px solid rgba(23,23,23,.18);
  border-radius:12px;
  outline:none;
  font-size:14px;
}

/* USER FORM */
.user-form-stack{gap:16px;}
.user-form-stack .form-section-card{margin:0;}
.user-profile-grid{display:grid;grid-template-columns:minmax(280px,.72fr) minmax(0,1.28fr);gap:18px;align-items:start;}
.user-image-field{min-width:0;padding:16px;border:1px solid var(--kyro-line);border-radius:16px;background:#faf8f2;}
.user-contact-fields{display:flex;flex-direction:column;gap:14px;min-width:0;}
.user-field-help{margin-top:0;color:var(--kyro-muted);font-size:11px;line-height:1.5;}
.user-form-stack input[readonly]{background:#f5f2e9;color:var(--kyro-muted);cursor:default;}
@media(max-width:760px){.user-profile-grid{grid-template-columns:1fr;}}

/* TABLET */

/* =========================================================
   SIDEBAR / MEDIUM DESKTOP REFINEMENT
   UI ONLY — no application logic changed
========================================================= */
.kyro-admin .admin-sidebar{width:238px;min-width:238px;padding:24px 14px 18px;}
.kyro-admin .admin-content{margin-left:238px;}
.kyro-admin .admin-section-label{margin:22px 10px 8px;font-size:10px;letter-spacing:.16em;}
.kyro-admin .admin-nav,.kyro-admin .admin-sidebar-bottom{gap:4px;}
.kyro-admin .admin-nav button,.kyro-admin .admin-sidebar-bottom button,.kyro-admin .admin-sidebar-bottom a{min-height:40px;padding:8px 11px;gap:10px;border-radius:10px;font-size:13px;line-height:1.2;}
.kyro-admin .nav-icon{width:18px;min-width:18px;height:18px;display:flex;align-items:center;justify-content:center;}
.kyro-admin .nav-icon svg{width:17px;height:17px;stroke-width:1.6;}
.kyro-admin .nav-label{font-size:13px;font-weight:500;white-space:nowrap;}
.kyro-admin .admin-user-mini{margin-top:auto;padding:11px 8px 0;}
.kyro-admin .admin-user-mini .avatar{width:34px;height:34px;min-width:34px;}
.kyro-admin .mini-user-info strong{font-size:12px;}
.kyro-admin .mini-user-info small{font-size:10px;}
@media(max-width:1100px) and (min-width:761px){
  .kyro-admin .admin-sidebar{width:220px;min-width:220px;padding-left:12px;padding-right:12px;}
  .kyro-admin .admin-content{margin-left:220px;}
  .kyro-admin .admin-nav button,.kyro-admin .admin-sidebar-bottom button,.kyro-admin .admin-sidebar-bottom a{min-height:38px;padding:7px 9px;gap:8px;font-size:12px;}
  .kyro-admin .nav-icon{width:17px;min-width:17px;height:17px;}
  .kyro-admin .nav-icon svg{width:16px;height:16px;}
  .kyro-admin .nav-label{font-size:12px;}
}

@media(max-width:1050px){

  :root{
    --rail:196px;
  }

  .overview-grid,
  .settings-page{
    grid-template-columns:1fr;
  }

}

/* MOBILE */

@media(max-width:760px){

  .kyro-admin .admin-sidebar{
    top:auto;
    right:0;
    left:0;
    bottom:0;
    width:100%;
    height:70px;
    flex-direction:row;
    padding:6px;
  }

  .sidebar-top,
  .admin-user-mini,
  .admin-section-label{
    display:none!important;
  }

  .kyro-admin .admin-nav,
  .admin-sidebar-bottom{
    flex-direction:row;
    gap:2px;
    margin:0;
    padding:0;
    border:0;
  }

  .kyro-admin .admin-nav{
    flex:4;
  }

  .admin-sidebar-bottom{
    flex:2;
  }

  .kyro-admin .admin-nav button,
  .kyro-admin .admin-sidebar-bottom button,
  .kyro-admin .admin-sidebar-bottom a{
    flex:1;
    min-width:0;
    height:auto;
    flex-direction:column;
    justify-content:center;
    gap:4px;
    padding:4px 2px;
    font-size:10px;
    text-align:center;
  }

  .kyro-admin .admin-content{
    margin-left:0;
    padding:
      22px
      14px
      96px;
  }

  .kyro-admin .admin-header{
    flex-direction:column;
    gap:16px;
  }

  .admin-header-actions{
    width:100%;
  }

  .live-pill{
    margin-right:auto;
  }

  .welcome-card{
    min-height:320px;
    padding:26px;
  }

  .welcome-bottle{
    position:absolute;
    right:-8px;
    bottom:10px;
    opacity:.6;
  }

  .metric-grid,
  .quick-grid{
    grid-template-columns:1fr;
  }

  .collection-toolbar{
    align-items:stretch;
    flex-direction:column;
  }

  .search-box{
    width:100%;
  }

  .primary-action{
    width:100%;
  }

  .record-modal-header-fixed{
    padding:
      22px
      20px
      18px;
  }

  .record-modal-content{
    padding:20px;
  }

  .record-modal-footer{
    padding:14px 20px;
  }

  .record-modal-footer .primary-action{
    flex:1;
  }

  .form-grid-2,
  .notes-grid,
  .image-upload-grid,
  .image-upload-list,
  .decant-options,
  .visibility-grid{
    grid-template-columns:1fr;
  }

  .image-manager-intro{
    flex-direction:column;
  }

  .check-grid{
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }

  .decant-fields{
    grid-template-columns:1fr;
  }

  .settings-form,
  .profile-card{
    padding:24px;
  }
}

@media(max-width:460px){

  .kyro-admin .admin-header h1{
    font-size:32px;
  }

  .welcome-card h2{
    font-size:30px;
  }

  .admin-header-actions
  .admin-icon-button{
    display:none;
  }

}

/* Clean, readable admin UI refinements */
.kyro-admin { font-size: 15px; }
.kyro-admin .admin-content { padding-top: 30px; }
.kyro-admin .admin-header h1 { font-weight: 700; letter-spacing: -.035em; }
.kyro-admin .header-subtitle { font-size: 15px; color: #57534e; }
.collection-toolbar { margin-bottom: 18px; }
.search-box { box-shadow: 0 4px 14px rgba(23,23,23,.035); }
.search-box input { font-size: 15px; color: #171717; }
.primary-action { min-height: 46px; font-size: 14px; padding: 0 20px; }
.table-card { border-radius: 18px; box-shadow: 0 12px 35px rgba(23,23,23,.045); }
.table-card table { min-width: 760px; }
.table-card th { padding: 17px 20px; color: #514b42; font-size: 12px; font-weight: 800; letter-spacing: .045em; }
.table-card td { padding: 18px 20px; color: #292524; font-size: 14px; line-height: 1.45; }
.table-card tbody tr { transition: background .18s ease; }
.table-card tbody tr:hover { background: #fbf8f0; }
.table-card td strong { color: #171717; font-size: 15px; font-weight: 750; }
.table-card td small { display: block; margin-top: 4px; color: #625d55; font-size: 13px; }
.cell-flex { gap: 14px; }
.table-avatar { width: 42px; height: 42px; border-radius: 14px; font-size: 16px; font-weight: 800; }
.product-thumb { width: 52px; height: 60px; flex-basis: 52px; border: 1px solid rgba(23,23,23,.08); }
.row-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.row-actions button.table-icon-action { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; margin: 0; padding: 0; border: 1px solid #e7e1d6; border-radius: 12px; background: #fff; color: #292524; cursor: pointer; transition: background .18s, border-color .18s, transform .18s; }
.row-actions button.table-icon-action:hover { transform: translateY(-1px); background: #f8f4eb; border-color: #cbb58d; }
.row-actions button.table-icon-action svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.row-actions button.delete-action { color: #b42318; border-color: #f0d6d3; }
.row-actions button.delete-action:hover { background: #fff1f0; border-color: #e7aaa4; }
.record-modal { width: min(900px, 100%); border-radius: 22px; }
.record-modal-header-fixed { padding: 24px 28px 18px; }
.record-modal-header-fixed h2 { font-family: inherit; font-size: clamp(25px, 3vw, 32px); font-weight: 800; letter-spacing: -.035em; }
.record-modal-content { padding: 18px 24px 24px; }
.form-section-card { padding: 20px; border-radius: 16px; }
.form-section-heading { margin-bottom: 14px; align-items: center; }
.form-section-heading h3 { margin: 0; font-family: inherit; font-size: 18px; font-weight: 800; letter-spacing: -.015em; }
.form-section-heading p { display: none; }
.form-section-number { display: none; }
.form-field { gap: 6px; }
.form-field > span, .field-mini-label, .check-group-title { color: #292524; font-size: 12px; font-weight: 750; letter-spacing: 0; text-transform: none; }
.form-field input, .form-field select, .form-field textarea { min-height: 46px; border-color: #d9d4ca; border-radius: 10px; font-size: 15px; }
.form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color: #9a7945; box-shadow: 0 0 0 3px rgba(154,121,69,.13); }
.user-field-help, .image-manager-help { font-size: 12px; color: #57534e; }
.simple-form-stack { display: grid; gap: 14px; }
.simple-form-stack > label { display: flex; flex-direction: column; gap: 7px; color: #292524; font-size: 13px; font-weight: 750; }
.simple-form-stack > label input, .simple-form-stack > label select { width: 100%; min-height: 46px; padding: 10px 12px; border: 1px solid #d9d4ca; border-radius: 10px; background: #fff; color: #171717; font: inherit; }
.simple-form-stack > label input:focus, .simple-form-stack > label select:focus { outline: none; border-color: #9a7945; box-shadow: 0 0 0 3px rgba(154,121,69,.13); }
.record-modal-footer { padding: 15px 24px; }
.modal-cancel { min-height: 44px; font-size: 14px; }
.settings-page { display: grid; grid-template-columns: minmax(240px,.72fr) minmax(0,1.28fr); gap: 18px; max-width: 1100px; margin: 26px auto 0; align-items: start; }
.profile-card, .settings-form { border: 1px solid var(--kyro-line); border-radius: 20px; background: #fffefa; box-shadow: 0 12px 35px rgba(23,23,23,.045); }
.profile-card { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 28px; }
.large-avatar { overflow: hidden; display: grid; place-items: center; width: 82px; height: 82px; margin-bottom: 10px; border-radius: 22px; background: #171717; color: #d0ad70; font-size: 30px; font-weight: 800; }
.large-avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile-card h2 { margin: 0; font-family: inherit; font-size: 24px; font-weight: 800; overflow-wrap: anywhere; }
.profile-card p { margin: 0; color: #57534e; overflow-wrap: anywhere; }
.settings-form { gap: 20px; padding: 28px; }
.settings-title h3 { margin: 7px 0 0; font-family: inherit; font-size: 24px; font-weight: 800; }
.settings-form .form-grid-2 { gap: 16px; }
.settings-actions { display: flex; justify-content: flex-end; }
@media(max-width:850px) { .settings-page { grid-template-columns: 1fr; } .profile-card { flex-direction: row; flex-wrap: wrap; align-items: center; } .large-avatar { margin: 0 12px 0 0; } }
@media(max-width:760px) { .record-modal { max-height: calc(100dvh - 20px); } .modal-backdrop { padding: 10px; } .record-modal-header-fixed { padding: 20px 18px 16px; } .record-modal-content { padding: 14px; } .form-section-card { padding: 15px; } .form-grid-2, .notes-grid { grid-template-columns: 1fr; } .settings-form { padding: 20px; } .settings-actions .primary-action { width: 100%; } }

/* PRODUCTS TABLE — clear 5ml / 10ml columns */
.table-card table.products-table { min-width: 860px; }
.products-table .size-th { min-width: 190px; }
.products-table .size-th small { display: block; margin-top: 4px; color: #6b655b; font-size: 11px; font-weight: 600; letter-spacing: 0; text-transform: none; }
.size-badge { display: inline-flex; align-items: center; min-height: 26px; padding: 0 12px; border-radius: 999px; background: #171717; color: #d0ad70; font-size: 12px; font-weight: 800; letter-spacing: .04em; }
.products-table td.size-td { vertical-align: top; padding-top: 20px; border-left: 1px dashed rgba(23,23,23,.1); }
.products-table td:first-child { vertical-align: top; padding-top: 20px; }
.size-cell { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.size-price-row { display: flex; align-items: center; gap: 8px; }
.size-price { color: #171717; font-size: 17px; font-weight: 800; letter-spacing: -.01em; }
.size-discount { display: inline-flex; align-items: center; min-height: 20px; padding: 0 7px; border-radius: 6px; background: rgba(143,109,54,.14); color: #6f5226; font-size: 11px; font-weight: 800; }
.size-labelled { color: #8a847a; font-size: 12px; text-decoration: line-through; }
.size-empty { display: inline-flex; align-items: center; min-height: 28px; padding: 0 12px; border: 1px dashed rgba(23,23,23,.2); border-radius: 999px; color: #8a847a; font-size: 12px; font-weight: 600; }
.stock.warn { background: rgba(170,137,83,.18); color: #7a5518; }
.stock.out { background: rgba(164,76,54,.12); color: #9a3f2a; }
          `,
        }}
      />
    </main>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function Overview({
  counts,
  onNavigate,
}: {
  counts: {
    users: number;
    products: number;
    orders: number;
  };
  onNavigate: (resource: Resource) => void;
}) {
  const metrics = [
    {
      id: "users" as Resource,
      label: "Total customers",
      value: counts.users,
      trend: "↑ 12% this month",
    },

    {
      id: "products" as Resource,
      label: "Fragrances listed",
      value: counts.products,
      trend: "↑ 4 new scents",
    },

    {
      id: "orders" as Resource,
      label: "Orders received",
      value: counts.orders,
      trend: "↑ 8% this week",
    },
  ];

  return (
    <div className="overview">

      <div className="welcome-card">

        <div>
          <span className="admin-kicker">
            KYRO / HOUSE NOTE
          </span>

          <h2>
            Your fragrance house is ready for its next chapter.
          </h2>

          <p>
            A quick read on the people, perfumes,
            and parcels moving through Kyro today.
          </p>
        </div>

        <div
          className="welcome-bottle"
          aria-hidden="true"
        >
          <div />

          <span>
            KYRO
            <br />
            <small>NO. 01</small>
          </span>
        </div>

      </div>

      <div className="metric-grid">

        {metrics.map((metric) => (
          <button
            key={metric.id}
            type="button"
            className="metric-card"
            onClick={() =>
              onNavigate(metric.id)
            }
          >
            <span>
              {metric.label}
            </span>

            <strong>
              {metric.value}
            </strong>

            <small>
              {metric.trend}
            </small>

            <i>→</i>
          </button>
        ))}

      </div>

      <div className="overview-grid">

        <div className="panel-card">

          <div className="panel-heading">

            <div>
              <span className="admin-kicker">
                YOUR NEXT MOVES
              </span>

              <h3>
                Curate with intention
              </h3>
            </div>

            <span>✦</span>

          </div>

          <div className="quick-grid">

            <button
              type="button"
              onClick={() =>
                onNavigate("products")
              }
            >
              <b>+</b>
              <span>
                Compose a fragrance
              </span>
              <small>
                Bring a new decant to life
              </small>
            </button>

            <button
              type="button"
              onClick={() =>
                onNavigate("orders")
              }
            >
              <b>□</b>
              <span>
                Guide your parcels
              </span>
              <small>
                Keep every order moving
              </small>
            </button>

            <button
              type="button"
              onClick={() =>
                onNavigate("users")
              }
            >
              <b>♙</b>
              <span>
                Meet your collectors
              </span>
              <small>
                Know who wears Kyro
              </small>
            </button>

          </div>

        </div>

        <div className="panel-card inspiration-card">

          <span className="admin-kicker">
            A HOUSE NOTE
          </span>

          <p>
            Scent is the invisible signature
            we leave on a room.
          </p>

          <small>
            — Kyro Parfums
          </small>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   COLLECTION
========================================================= */

type DecantInfo = {
  size: number;
  price: number;
  labelledPrice: number;
  stock: number;
};

function getDecant(record: RecordItem, size: number): DecantInfo | null {
  if (!Array.isArray(record.decants)) {
    return null;
  }

  const found = (record.decants as Array<Record<string, unknown>>).find(
    (item) => Number(item?.size) === size
  );

  if (!found) {
    return null;
  }

  return {
    size,
    price: Number(found.price ?? 0),
    labelledPrice: Number(found.labelledPrice ?? 0),
    stock: Number(found.stock ?? 0),
  };
}

function formatRupees(value: number) {
  return `Rs. ${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function SizeCell({ decant }: { decant: DecantInfo | null }) {
  if (!decant) {
    return <span className="size-empty">Not offered</span>;
  }

  const hasDiscount =
    decant.labelledPrice > decant.price && decant.price > 0;

  const discount = hasDiscount
    ? Math.round((1 - decant.price / decant.labelledPrice) * 100)
    : 0;

  const stockClass =
    decant.stock <= 0
      ? "stock out"
      : decant.stock < 5
      ? "stock warn"
      : "stock";

  const stockText =
    decant.stock <= 0
      ? "Sold out"
      : decant.stock < 5
      ? `Only ${decant.stock} left`
      : `${decant.stock} in stock`;

  return (
    <div className="size-cell">
      <div className="size-price-row">
        <span className="size-price">{formatRupees(decant.price)}</span>

        {hasDiscount && (
          <span className="size-discount">-{discount}%</span>
        )}
      </div>

      {hasDiscount && (
        <span className="size-labelled">
          {formatRupees(decant.labelledPrice)}
        </span>
      )}

      <span className={stockClass}>{stockText}</span>
    </div>
  );
}

function Collection({
  resource,
  records,
  query,
  setQuery,
  loading,
  onAdd,
  onEdit,
  onDelete,
}: {
  resource: CollectionResource;
  records: RecordItem[];
  query: string;
  setQuery: (value: string) => void;
  loading: boolean;
  onAdd: () => void;
  onEdit: (record: RecordItem) => void;
  onDelete: (id: string) => void;
}) {
  const columnCount =
    resource === "users" ? 4 : resource === "products" ? 4 : 5;

  return (
    <div className="collection">

      <div className="collection-toolbar">

        <div className="search-box">

          <span>⌕</span>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${resource}...`}
            aria-label={`Search ${resource}`}
          />

        </div>

        <button
          type="button"
          className="primary-action"
          onClick={onAdd}
        >
          + Add{" "}
          {resource === "products"
            ? "fragrance"
            : resource === "users"
            ? "customer"
            : "order"}
        </button>

      </div>

      <div className="table-card">

        <div className="table-scroll">

          <table
            className={
              resource === "products" ? "products-table" : undefined
            }
          >

            <thead>

              <tr>

                {resource === "users" && (
                  <>
                    <th>Customer</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th />
                  </>
                )}

                {resource === "products" && (
                  <>
                    <th>Fragrance</th>

                    <th className="size-th">
                      <span className="size-badge">5 ml</span>
                      <small>Price &amp; stock</small>
                    </th>

                    <th className="size-th">
                      <span className="size-badge">10 ml</span>
                      <small>Price &amp; stock</small>
                    </th>

                    <th />
                  </>
                )}

                {resource === "orders" && (
                  <>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th />
                  </>
                )}

              </tr>

            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan={columnCount} className="empty-state">
                    Loading your collection...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="empty-state">
                    No records yet. Add your first one above.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id}>

                    {/* USERS */}

                    {resource === "users" && (
                      <>
                        <td>
                          <div className="cell-flex">

                            <span className="table-avatar">
                              {String(record.name ?? "?").slice(0, 1)}
                            </span>

                            <div>
                              <strong>
                                {String(record.name ?? "Unnamed")}
                              </strong>

                              <small>
                                {String(record.email ?? "")}
                              </small>
                            </div>

                          </div>
                        </td>

                        <td>
                          <span className="tag">
                            {String(record.role ?? "customer")}
                          </span>
                        </td>

                        <td>{formatDate(record.createdAt)}</td>
                      </>
                    )}

                    {/* PRODUCTS */}

                    {resource === "products" && (
                      <>
                        <td>

                          <div className="cell-flex">

                            <span
                              className="product-thumb"
                              style={
                                Array.isArray(record.images) &&
                                record.images[0]
                                  ? {
                                      backgroundImage: `url("${String(
                                        record.images[0]
                                      )}")`,
                                    }
                                  : undefined
                              }
                            />

                            <div>

                              <strong>
                                {String(record.name ?? "Unnamed scent")}
                              </strong>

                              <div>
                                {String(record.brand ?? "Independent")}{" "}
                                ·{" "}
                                {String(
                                  record.category ?? "Uncategorised"
                                )}
                              </div>

                              <small>
                                {String(record.type ?? "Fragrance")}
                              </small>

                            </div>

                          </div>

                        </td>

                        <td className="size-td">
                          <SizeCell decant={getDecant(record, 5)} />
                        </td>

                        <td className="size-td">
                          <SizeCell decant={getDecant(record, 10)} />
                        </td>
                      </>
                    )}

                    {/* ORDERS */}

                    {resource === "orders" && (
                      <>
                        <td>
                          <strong>
                            #
                            {String(record._id).slice(-6).toUpperCase()}
                          </strong>

                          <small>
                            {Array.isArray(record.items)
                              ? (record.items as unknown[]).length
                              : Number(record.items ?? 1)}{" "}
                            item(s)
                          </small>
                        </td>

                        <td>
                          {String(
                            (
                              record.shipping as
                                | Record<string, unknown>
                                | undefined
                            )?.name ??
                              record.customerName ??
                              record.customer ??
                              "Guest"
                          )}
                        </td>

                        <td className="price">
                          Rs.{" "}
                          {Number(record.total ?? 0).toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td>
                          <span
                            className={`order-status ${String(
                              record.status ?? "pending"
                            )}`}
                          >
                            {String(record.status ?? "pending")}
                          </span>
                        </td>
                      </>
                    )}

                    <td className="row-actions">

                      <button
                        type="button"
                        className="table-icon-action edit-action"
                        onClick={() => onEdit(record)}
                        aria-label={`Edit ${resource.slice(0, -1)}`}
                        title="Edit"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
                      </button>

                      <button
                        type="button"
                        className="table-icon-action delete-action"
                        onClick={() => onDelete(record._id)}
                        aria-label={`Delete ${resource.slice(0, -1)}`}
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>
                      </button>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   RECORD MODAL
========================================================= */

function RecordModal({
  collection,
  editing,
  onClose,
  onSubmit,
}: {
  collection: CollectionResource;
  editing: RecordItem | null;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void;
}) {
  const defaults =
    emptyForms[collection];

  const isProduct =
    collection === "products";

  const [imageUploadingCount, setImageUploadingCount] =
    useState(0);

  /* =====================================================
     EXISTING IMAGES
  ===================================================== */

  const existingImages =
    Array.isArray(editing?.images)
      ? editing.images.map(String)
      : editing?.imageUrl
      ? [String(editing.imageUrl)]
      : [];

  const existingDecants =
    Array.isArray(editing?.decants)
      ? editing.decants
      : [];

  // Keep an editable list instead of hard-coding two image fields.
  // There is intentionally no maximum number of images.
  const [productImages, setProductImages] =
    useState<string[]>(
      existingImages.length > 0
        ? existingImages
        : [""]
    );

  /* =====================================================
     EXISTING DECANTS
  ===================================================== */

  const decant5 = existingDecants.find(
    (item) =>
      Number(
        (item as Record<string, unknown>)
          .size
      ) === 5
  ) as Record<string, unknown> | undefined;

  const decant10 = existingDecants.find(
    (item) =>
      Number(
        (item as Record<string, unknown>)
          .size
      ) === 10
  ) as Record<string, unknown> | undefined;

  /* =====================================================
     EXISTING FRAGRANCE DATA
  ===================================================== */

  const fragrance =
    (editing?.fragrance ?? {}) as Record<
      string,
      unknown
    >;

  const notes =
    (editing?.notes ?? {}) as Record<
      string,
      unknown
    >;

  const selectedSeasons =
    Array.isArray(fragrance.season)
      ? fragrance.season.map(String)
      : [];

  const selectedOccasions =
    Array.isArray(fragrance.occasion)
      ? fragrance.occasion.map(String)
      : [];

  const isSubmitDisabled =
    imageUploadingCount > 0;

  function changeUploadState(
    uploading: boolean
  ) {
    setImageUploadingCount(
      (current) =>
        Math.max(
          0,
          current +
            (uploading ? 1 : -1)
        )
    );
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >

      <form
        className="record-modal record-modal-scrollable"
        onSubmit={onSubmit}
      >

        {/* HEADER */}

        <div className="record-modal-header-fixed">

          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>

          <span className="admin-kicker">
            {editing
              ? collection === "users"
                ? "EDIT CUSTOMER"
                : collection === "orders"
                ? "EDIT ORDER"
                : "EDIT FRAGRANCE"
              : collection === "users"
              ? "NEW CUSTOMER"
              : collection === "orders"
              ? "NEW ORDER"
              : "NEW FRAGRANCE"}
          </span>

          <h2 id="modal-title">
            {editing
              ? collection === "orders" ? "Update order status" : collection === "users" ? "Edit customer" : "Edit fragrance"
              : collection === "products" ? "Add fragrance" : collection === "users" ? "Add customer" : "Add order"}
          </h2>

        </div>

        {/* CONTENT */}

        <div className="record-modal-content">

          {isProduct ? (

            <div className="perfume-form">

              {/* =================================================
                  01 IMAGES
              ================================================= */}

              <section className="form-section-card">

                <div className="form-section-heading">

                  <div>
                    <span className="admin-kicker">
                      01 / IMAGES
                    </span>

                    <h3>
                      Product photography
                    </h3>

                    <p>
                      Upload up to two clean
                      perfume images. They will
                      be saved in the MongoDB
                      <code>images[]</code> array.
                    </p>
                  </div>

                  <span className="form-section-number">
                    01
                  </span>

                </div>

                <div className="product-image-manager">
                  <div className="image-manager-intro">
                    <div>
                      <strong>Add as many product photos as you want.</strong>
                      <p>
                        The first image is used as the main product image.
                        All uploaded images are saved in the MongoDB <code>images[]</code> array.
                      </p>
                    </div>

                    <span className="image-count-badge">
                      {productImages.filter(Boolean).length} image
                      {productImages.filter(Boolean).length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="image-upload-list">
                    {productImages.map((url, index) => (
                      <div className="image-upload-card image-upload-card-modern" key={`product-image-${index}`}>
                        <div className="image-card-top">
                          <div>
                            <span className="field-mini-label">
                              {index === 0 ? "MAIN IMAGE" : `IMAGE ${index + 1}`}
                            </span>
                            <small>
                              {index === 0
                                ? "Used as the primary product photo."
                                : "Additional product photo."}
                            </small>
                          </div>

                          {productImages.length > 1 && (
                            <button
                              type="button"
                              className="image-remove-button"
                              onClick={() => {
                                setProductImages((current) =>
                                  current.filter((_, imageIndex) => imageIndex !== index)
                                );
                              }}
                              aria-label={`Remove image ${index + 1}`}
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <MediaUpload
                          name={`images-${index}`}
                          initialUrl={url}
                          onChange={(nextUrl) => {
                            setProductImages((current) => {
                              const next = [...current];
                              next[index] = nextUrl;
                              return next;
                            });
                          }}
                          onUploadStateChange={changeUploadState}
                        />

                        <input
                          type="hidden"
                          name="images"
                          value={url}
                          readOnly
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="add-image-button"
                    onClick={() => setProductImages((current) => [...current, ""])}
                  >
                    <span>+</span>
                    Add another image
                  </button>

                  <p className="image-manager-help">
                    You can keep adding images. Empty image slots are ignored when the product is saved.
                  </p>
                </div>
              </section>

              {/* =================================================
                  02 BASIC INFORMATION
              ================================================= */}

              <section className="form-section-card">

                <div className="form-section-heading">

                  <div>
                    <span className="admin-kicker">
                      02 / IDENTITY
                    </span>

                    <h3>
                      Perfume information
                    </h3>

                    <p>
                      Give customers the
                      essential information
                      they need before buying
                      a decant.
                    </p>
                  </div>

                  <span className="form-section-number">
                    02
                  </span>

                </div>

                <div className="form-grid-2">

                  {/* NAME */}

                  <label className="form-field full-field">

                    <span>
                      Perfume name *
                    </span>

                    <input
                      name="name"
                      defaultValue={String(
                        editing?.name ??
                          (defaults as typeof emptyForms.products).name
                      )}
                      required
                      placeholder="e.g. Dior Sauvage Eau de Parfum"
                    />

                  </label>

                  {/* BRAND */}

                  <label className="form-field">

                    <span>
                      Brand *
                    </span>

                    <input
                      name="brand"
                      defaultValue={String(
                        editing?.brand ??
                          (defaults as typeof emptyForms.products).brand
                      )}
                      required
                      placeholder="e.g. Dior"
                      list="perfume-brands"
                    />

                    <datalist id="perfume-brands">

                      <option value="Dior" />
                      <option value="Chanel" />
                      <option value="Yves Saint Laurent" />
                      <option value="Tom Ford" />
                      <option value="Creed" />
                      <option value="Armani" />
                      <option value="Jean Paul Gaultier" />
                      <option value="Versace" />
                      <option value="Rabanne" />
                      <option value="Maison Francis Kurkdjian" />

                    </datalist>

                  </label>

                  {/* CATEGORY */}

                  <label className="form-field">

                    <span>
                      Category *
                    </span>

                    <select
                      name="category"
                      defaultValue={String(
                        editing?.category ??
                          "Men"
                      )}
                      required
                    >
                      <option value="Men">
                        Men
                      </option>

                      <option value="Women">
                        Women
                      </option>

                      <option value="Unisex">
                        Unisex
                      </option>
                    </select>

                  </label>

                  {/* TYPE */}

                  <label className="form-field">

                    <span>
                      Fragrance type *
                    </span>

                    <select
                      name="type"
                      defaultValue={String(
                        editing?.type ??
                          "Eau de Parfum"
                      )}
                      required
                    >
                      <option value="Eau de Parfum">
                        Eau de Parfum
                      </option>

                      <option value="Eau de Toilette">
                        Eau de Toilette
                      </option>

                      <option value="Parfum">
                        Parfum
                      </option>

                      <option value="Eau de Cologne">
                        Eau de Cologne
                      </option>

                      <option value="Extrait de Parfum">
                        Extrait de Parfum
                      </option>
                    </select>

                  </label>

                  {/* CONCENTRATION */}

                  <label className="form-field">

                    <span>
                      Concentration *
                    </span>

                    <select
                      name="concentration"
                      defaultValue={String(
                        fragrance.concentration ??
                          "Eau de Parfum"
                      )}
                      required
                    >
                      <option value="Eau de Parfum">
                        Eau de Parfum
                      </option>

                      <option value="Eau de Toilette">
                        Eau de Toilette
                      </option>

                      <option value="Parfum">
                        Parfum
                      </option>

                      <option value="Extrait de Parfum">
                        Extrait de Parfum
                      </option>

                      <option value="Eau de Cologne">
                        Eau de Cologne
                      </option>
                    </select>

                  </label>

                  {/* GENDER */}

                  <label className="form-field">

                    <span>
                      Gender *
                    </span>

                    <select
                      name="gender"
                      defaultValue={String(
                        fragrance.gender ??
                          "Men"
                      )}
                      required
                    >
                      <option value="Men">
                        Men
                      </option>

                      <option value="Women">
                        Women
                      </option>

                      <option value="Unisex">
                        Unisex
                      </option>
                    </select>

                  </label>

                  {/* LONGEVITY */}

                  <label className="form-field">

                    <span>
                      Longevity
                    </span>

                    <select
                      name="longevity"
                      defaultValue={String(
                        fragrance.longevity ??
                          ""
                      )}
                    >
                      <option value="">
                        Select longevity
                      </option>

                      <option value="4-6 hours">
                        4-6 hours
                      </option>

                      <option value="6-8 hours">
                        6-8 hours
                      </option>

                      <option value="8-10 hours">
                        8-10 hours
                      </option>

                      <option value="10-12 hours">
                        10-12 hours
                      </option>

                      <option value="12+ hours">
                        12+ hours
                      </option>
                    </select>

                  </label>

                  {/* SILLAGE */}

                  <label className="form-field">

                    <span>
                      Sillage
                    </span>

                    <select
                      name="sillage"
                      defaultValue={String(
                        fragrance.sillage ??
                          "Moderate"
                      )}
                    >
                      <option value="Soft">
                        Soft
                      </option>

                      <option value="Moderate">
                        Moderate
                      </option>

                      <option value="Strong">
                        Strong
                      </option>

                      <option value="Very Strong">
                        Very Strong
                      </option>
                    </select>

                  </label>

                  {/* SHORT DESCRIPTION */}

                  <label className="form-field full-field">

                    <span>
                      Short description
                    </span>

                    <input
                      name="shortDescription"
                      defaultValue={String(
                        editing?.shortDescription ??
                          ""
                      )}
                      placeholder="Fresh, spicy and woody men's fragrance."
                    />

                  </label>

                  {/* DESCRIPTION */}

                  <label className="form-field full-field">

                    <span>
                      Full description
                    </span>

                    <textarea
                      name="description"
                      defaultValue={String(
                        editing?.description ??
                          ""
                      )}
                      rows={4}
                      placeholder="Dior Sauvage Eau de Parfum is a fresh and powerful fragrance."
                    />

                  </label>

                </div>

              </section>

              {/* =================================================
                  03 PROFILE
              ================================================= */}

              <section className="form-section-card">

                <div className="form-section-heading">

                  <div>
                    <span className="admin-kicker">
                      03 / PROFILE
                    </span>

                    <h3>
                      When should customers wear it?
                    </h3>

                    <p>
                      Select all seasons and
                      occasions that match this
                      fragrance.
                    </p>
                  </div>

                  <span className="form-section-number">
                    03
                  </span>

                </div>

                {/* SEASONS */}

                <div className="check-group">

                  <span className="check-group-title">
                    Seasons
                  </span>

                  <div className="check-grid">

                    {[
                      "Spring",
                      "Summer",
                      "Autumn",
                      "Winter",
                    ].map((item) => (
                      <label
                        className="check-card"
                        key={item}
                      >

                        <input
                          type="checkbox"
                          name="season"
                          value={item}
                          defaultChecked={selectedSeasons.includes(
                            item
                          )}
                        />

                        <span className="custom-check">
                          ✓
                        </span>

                        <span>
                          {item}
                        </span>

                      </label>
                    ))}

                  </div>

                </div>

                {/* OCCASIONS */}

                <div className="check-group">

                  <span className="check-group-title">
                    Occasions
                  </span>

                  <div className="check-grid">

                    {[
                      "Casual",
                      "Office",
                      "Date Night",
                      "Party",
                      "Formal",
                      "Special Occasion",
                    ].map((item) => (
                      <label
                        className="check-card"
                        key={item}
                      >

                        <input
                          type="checkbox"
                          name="occasion"
                          value={item}
                          defaultChecked={selectedOccasions.includes(
                            item
                          )}
                        />

                        <span className="custom-check">
                          ✓
                        </span>

                        <span>
                          {item}
                        </span>

                      </label>
                    ))}

                  </div>

                </div>

              </section>

              {/* =================================================
                  04 NOTES
              ================================================= */}

              <section className="form-section-card">

                <div className="form-section-heading">

                  <div>
                    <span className="admin-kicker">
                      04 / NOTES
                    </span>

                    <h3>
                      Fragrance notes
                    </h3>

                    <p>
                      Separate multiple notes
                      with commas. They will
                      become MongoDB arrays.
                    </p>
                  </div>

                  <span className="form-section-number">
                    04
                  </span>

                </div>

                <div className="notes-grid">

                  <label className="form-field">

                    <span>
                      Top notes
                    </span>

                    <textarea
                      name="topNotes"
                      rows={3}
                      defaultValue={arrayToText(
                        notes.top
                      )}
                      placeholder="Calabrian Bergamot, Pepper"
                    />

                  </label>

                  <label className="form-field">

                    <span>
                      Middle notes
                    </span>

                    <textarea
                      name="middleNotes"
                      rows={3}
                      defaultValue={arrayToText(
                        notes.middle
                      )}
                      placeholder="Lavender, Pink Pepper"
                    />

                  </label>

                  <label className="form-field full-field">

                    <span>
                      Base notes
                    </span>

                    <textarea
                      name="baseNotes"
                      rows={3}
                      defaultValue={arrayToText(
                        notes.base
                      )}
                      placeholder="Ambroxan, Cedar, Patchouli"
                    />

                  </label>

                </div>

              </section>

              {/* =================================================
                  05 DECANTS
              ================================================= */}

              <section className="form-section-card">

                <div className="form-section-heading">

                  <div>

                    <span className="admin-kicker">
                      05 / DECANTS
                    </span>

                    <h3>
                      Choose what you sell
                    </h3>

                    <p>
                      Set the original labelled
                      price, Kyro selling price
                      and stock for each size.
                    </p>

                  </div>

                  <span className="form-section-number">
                    05
                  </span>

                </div>

                <div className="decant-options">

                  <DecantEditor
                    size={5}
                    enabled={
                      decant5
                        ? true
                        : !editing
                    }
                    labelledPrice={
                      decant5?.labelledPrice
                        ? Number(
                            decant5.labelledPrice
                          )
                        : ""
                    }
                    price={
                      decant5?.price
                        ? Number(
                            decant5.price
                          )
                        : ""
                    }
                    stock={
                      decant5?.stock
                        ? Number(
                            decant5.stock
                          )
                        : 0
                    }
                  />

                  <DecantEditor
                    size={10}
                    enabled={
                      decant10
                        ? true
                        : !editing
                    }
                    labelledPrice={
                      decant10?.labelledPrice
                        ? Number(
                            decant10.labelledPrice
                          )
                        : ""
                    }
                    price={
                      decant10?.price
                        ? Number(
                            decant10.price
                          )
                        : ""
                    }
                    stock={
                      decant10?.stock
                        ? Number(
                            decant10.stock
                          )
                        : 0
                    }
                  />

                </div>

              </section>

              {/* =================================================
                  06 VISIBILITY
              ================================================= */}

              <section className="form-section-card">

                <div className="form-section-heading">

                  <div>

                    <span className="admin-kicker">
                      06 / VISIBILITY
                    </span>

                    <h3>
                      Storefront settings
                    </h3>

                    <p>
                      Control how this fragrance
                      appears in your store.
                    </p>

                  </div>

                  <span className="form-section-number">
                    06
                  </span>

                </div>

                <div className="visibility-grid">

                  <label className="check-card toggle-card">

                    <input
                      type="checkbox"
                      name="isFeatured"
                      defaultChecked={Boolean(
                        editing?.isFeatured
                      )}
                    />

                    <span className="custom-check">
                      ✓
                    </span>

                    <span>
                      <strong>
                        Featured
                      </strong>

                      <small>
                        Show in featured
                        fragrance sections.
                      </small>
                    </span>

                  </label>

                  <label className="check-card toggle-card">

                    <input
                      type="checkbox"
                      name="isBestSeller"
                      defaultChecked={Boolean(
                        editing?.isBestSeller
                      )}
                    />

                    <span className="custom-check">
                      ✓
                    </span>

                    <span>
                      <strong>
                        Best seller
                      </strong>

                      <small>
                        Mark this fragrance
                        as a popular choice.
                      </small>
                    </span>

                  </label>

                  <label className="check-card toggle-card">

                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={
                        editing
                          ? Boolean(
                              editing.isActive
                            )
                          : true
                      }
                    />

                    <span className="custom-check">
                      ✓
                    </span>

                    <span>
                      <strong>
                        Active
                      </strong>

                      <small>
                        Allow customers to
                        see and purchase it.
                      </small>
                    </span>

                  </label>

                </div>

              </section>

            </div>

          ) : (

            /* =================================================
               USERS / ORDERS
            ================================================= */

            collection === "users" ? (
              <div className="simple-form-stack user-form-stack">
                <section className="form-section-card">
                  <div className="form-section-heading"><h3>Customer details</h3></div>
                  <div className="form-grid-2">
                    <label className="form-field"><span>Full name *</span><input name="name" defaultValue={String(editing?.name ?? "")} required autoComplete="name" placeholder="e.g. Kasun Perera" /></label>
                    <label className="form-field"><span>Username *</span><input name="username" defaultValue={String(editing?.username ?? "")} required autoComplete="username" placeholder="e.g. kasun" /></label>
                    <label className="form-field"><span>Email address *</span><input name="email" type="email" defaultValue={String(editing?.email ?? "")} required autoComplete="email" placeholder="e.g. kasun@example.com" /></label>
                    <label className="form-field"><span>{editing ? "New password" : "Password *"}</span><input name="password" type="password" defaultValue="" required={!editing} minLength={6} autoComplete="new-password" placeholder={editing ? "Leave blank to keep current password" : "Minimum 6 characters"} />{editing && <small className="user-field-help">Leave blank to keep the current password.</small>}</label>
                    <label className="form-field"><span>Role *</span><select name="role" defaultValue={String(editing?.role ?? "customer")} required><option value="customer">Customer</option><option value="admin">Administrator</option></select></label>
                  </div>
                </section>
                <section className="form-section-card">
                  <div className="form-section-heading"><h3>Contact details</h3></div>
                  <div className="user-profile-grid">
                    <div className="user-image-field"><MediaUpload name="imageUrl" initialUrl={String(editing?.imageUrl ?? "")} /></div>
                    <div className="user-contact-fields"><label className="form-field"><span>Phone number</span><input name="phone" type="tel" defaultValue={String(editing?.phone ?? "")} autoComplete="tel" placeholder="+94771234567" /></label><label className="form-field"><span>Address</span><textarea name="address" rows={5} defaultValue={String(editing?.address ?? "")} autoComplete="street-address" placeholder="Colombo, Sri Lanka" /></label></div>
                  </div>
                </section>
                <input type="hidden" name="createdAt" value={editing?.createdAt ? String(editing.createdAt) : new Date().toISOString()} readOnly />
              </div>
            ) : collection === "orders" ? (

              <AdminOrderDetail
                record={editing}
              />

            ) : (
              <div className="simple-form-stack">
                {Object.entries(defaults).map(([key, value]) => { const label=key.replace(/([A-Z])/g," $1").trim(); const isNumber=["total","items"].includes(key); return (<label key={key}><span>{label}</span>{key === "role" ? (<select name={key} defaultValue={String(editing?.[key] ?? value)} required><option value="customer">Customer</option><option value="admin">Administrator</option></select>) : key === "status" ? (<select name={key} defaultValue={String(editing?.[key] ?? value)} required><option value="pending">Pending</option><option value="paid">Paid</option><option value="shipped">Shipped</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>) : (<input name={key} defaultValue={String(editing?.[key] ?? value)} required type={isNumber ? "number" : key === "email" ? "email" : "text"} min={isNumber ? "0" : undefined} step={key === "total" ? "0.01" : undefined} placeholder={`Enter ${label.toLowerCase()}`} />)}</label>); })}
              </div>
            )

          )}

        </div>

        {/* FOOTER */}

        <div className="record-modal-footer">

          <button
            type="button"
            onClick={onClose}
            className="modal-cancel"
          >
            Cancel
          </button>

          {collection !== "orders" && (
            <button
              className="primary-action"
              type="submit"
              disabled={isSubmitDisabled}
            >
              {isSubmitDisabled
                ? "Uploading image..."
                : editing
                ? "Save changes"
                : isProduct
                ? "Create fragrance"
                : "Create record"}
            </button>
          )}

          {collection === "orders" && editing && (
            <button
              className="primary-action"
              type="submit"
            >
              Save status
            </button>
          )}

        </div>

      </form>

    </div>
  );
}

/* =========================================================
   DECANT EDITOR
========================================================= */

function DecantEditor({
  size,
  enabled,
  labelledPrice,
  price,
  stock,
}: {
  size: number;
  enabled: boolean;
  labelledPrice: number | string;
  price: number | string;
  stock: number;
}) {
  return (
    <div className="decant-card">

      <label className="decant-enable">

        <input
          type="checkbox"
          name={`decant${size}Enabled`}
          defaultChecked={enabled}
        />

        <span className="custom-check">
          ✓
        </span>

        <span className="decant-title">
          {size}ml Decant
        </span>

      </label>

      <div className="decant-fields">

        {/* LABELLED PRICE */}

        <label className="form-field">

          <span>
            Labelled Price (Rs.)
          </span>

          <input
            name={`decant${size}LabelledPrice`}
            type="number"
            min="0"
            step="1"
            defaultValue={labelledPrice}
            placeholder={
              size === 5
                ? "4000"
                : "7000"
            }
          />

        </label>

        {/* SELLING PRICE */}

        <label className="form-field">

          <span>
            Kyro Price (Rs.)
          </span>

          <input
            name={`decant${size}Price`}
            type="number"
            min="0"
            step="1"
            defaultValue={price}
            placeholder={
              size === 5
                ? "3500"
                : "6000"
            }
          />

        </label>

        {/* STOCK */}

        <label className="form-field">

          <span>
            Stock Units
          </span>

          <input
            name={`decant${size}Stock`}
            type="number"
            min="0"
            step="1"
            defaultValue={stock}
            placeholder={
              size === 5
                ? "15"
                : "10"
            }
          />

        </label>

      </div>

      <input
        type="hidden"
        name={`decant${size}Unit`}
        value="ml"
        readOnly
      />

      <p className="decant-help">
        Labelled price = original/reference
        price. Kyro price = actual customer
        selling price.
      </p>

    </div>
  );
}

/* =========================================================
   ADMIN ORDER DETAIL
========================================================= */

type AdminOrderItem = {
  name: string;
  quantity: number;
  price?: number;
  size?: string;
  imageUrl?: string;
  productId?: string;
};

type AdminOrderShipping = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
};

function AdminOrderDetail({
  record,
}: {
  record: RecordItem | null;
}) {
  const [imgErrors, setImgErrors] = useState<
    Record<number, boolean>
  >({});

  if (!record) {
    return (
      <p
        style={{
          padding: "20px",
          color: "rgba(23,23,23,.55)",
          fontSize: 13,
        }}
      >
        No order selected.
      </p>
    );
  }

  const items = Array.isArray(record.items)
    ? (record.items as unknown as AdminOrderItem[])
    : [];

  const shipping = (record.shipping ??
    {}) as AdminOrderShipping;

  const currentStatus = String(record.status ?? "pending");

  const createdAt = record.createdAt
    ? new Date(String(record.createdAt)).toLocaleDateString(
        "en-LK",
        { day: "2-digit", month: "long", year: "numeric" }
      )
    : "—";

  const total = Number(record.total ?? 0);

  const formatRs = (n: number) =>
    `Rs. ${n.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;



  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: "4px 0",
      }}
    >

      {/* ─── ORDER META ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {/* Left: ID + date */}
        <div
          style={{
            padding: "18px 20px",
            border: "1px solid rgba(23,23,23,.1)",
            borderRadius: 16,
            background: "rgba(255,254,250,.8)",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "#806537",
            }}
          >
            Order reference
          </p>
          <p
            style={{
              margin: "0 0 8px",
              fontFamily: "monospace",
              fontSize: 12,
              wordBreak: "break-all",
              color: "#171717",
            }}
          >
            {String(record._id)}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "rgba(23,23,23,.55)",
            }}
          >
            Placed {createdAt}
          </p>
        </div>

        {/* Right: total + current status badge */}
        <div
          style={{
            padding: "18px 20px",
            border: "1px solid rgba(23,23,23,.1)",
            borderRadius: 16,
            background: "rgba(255,254,250,.8)",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "#806537",
            }}
          >
            Order total
          </p>
          <p
            style={{
              margin: "0 0 10px",
              fontFamily:
                'Georgia, "Times New Roman", serif',
              fontSize: 26,
              fontWeight: 400,
            }}
          >
            {formatRs(total)}
          </p>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "capitalize" as const,
              background:
                currentStatus === "pending"
                  ? "rgba(170,137,83,.14)"
                  : currentStatus === "paid" ||
                    currentStatus === "delivered" ||
                    currentStatus === "completed"
                  ? "rgba(79,121,72,.14)"
                  : currentStatus === "shipped" ||
                    currentStatus === "processing"
                  ? "rgba(52,98,150,.12)"
                  : "rgba(160,66,50,.12)",
              color:
                currentStatus === "pending"
                  ? "#7a5518"
                  : currentStatus === "paid" ||
                    currentStatus === "delivered" ||
                    currentStatus === "completed"
                  ? "#3c6a35"
                  : currentStatus === "shipped" ||
                    currentStatus === "processing"
                  ? "#2c5584"
                  : "#9a3a2c",
            }}
          >
            {currentStatus}
          </span>
        </div>
      </div>

      {/* ─── STATUS EDITOR ─── */}
      <div
        style={{
          padding: "20px",
          border: "1px solid rgba(170,137,83,.28)",
          borderRadius: 16,
          background: "rgba(255,250,240,.7)",
        }}
      >
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: "#806537",
          }}
        >
          Change order status
        </p>

        <p
          style={{
            margin: "0 0 14px",
            fontSize: 12,
            color: "rgba(23,23,23,.55)",
            lineHeight: 1.55,
          }}
        >
          Select the new status and click{" "}
          <strong>Save status</strong>. The customer
          will see this updated on their orders page.
        </p>

        <select
          name="status"
          defaultValue={currentStatus}
          style={{
            width: "100%",
            minHeight: 48,
            padding: "0 14px",
            border: "1px solid rgba(23,23,23,.17)",
            borderRadius: 12,
            background: "#fff",
            color: "#171717",
            fontSize: 14,
            outline: "none",
          }}
        >
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="paid">Paid</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* ─── SHIPPING ADDRESS ─── */}
      {(shipping.name ||
        shipping.address ||
        shipping.email) && (
        <div
          style={{
            padding: "20px",
            border: "1px solid rgba(23,23,23,.1)",
            borderRadius: 16,
            background: "rgba(255,254,250,.8)",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "#806537",
            }}
          >
            Delivery address
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px 20px",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            {shipping.name && (
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "rgba(23,23,23,.45)",
                    textTransform: "uppercase",
                    letterSpacing: ".1em",
                  }}
                >
                  Name
                </span>
                <br />
                <strong>{shipping.name}</strong>
              </div>
            )}

            {shipping.email && (
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "rgba(23,23,23,.45)",
                    textTransform: "uppercase",
                    letterSpacing: ".1em",
                  }}
                >
                  Email
                </span>
                <br />
                {shipping.email}
              </div>
            )}

            {shipping.phone && (
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "rgba(23,23,23,.45)",
                    textTransform: "uppercase",
                    letterSpacing: ".1em",
                  }}
                >
                  Phone
                </span>
                <br />
                {shipping.phone}
              </div>
            )}

            {(shipping.address ||
              shipping.city) && (
              <div style={{ gridColumn: "1 / -1" }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "rgba(23,23,23,.45)",
                    textTransform: "uppercase",
                    letterSpacing: ".1em",
                  }}
                >
                  Address
                </span>
                <br />
                {shipping.address}
                {shipping.address && shipping.city
                  ? ", "
                  : ""}
                {shipping.city}
                {shipping.postalCode
                  ? ` ${shipping.postalCode}`
                  : ""}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ORDER ITEMS ─── */}
      {items.length > 0 && (
        <div>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "#806537",
            }}
          >
            Items ({items.length})
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr auto",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 14px",
                  border: "1px solid rgba(23,23,23,.08)",
                  borderRadius: 14,
                  background: "rgba(255,254,250,.85)",
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 10,
                    overflow: "hidden",
                    background:
                      "radial-gradient(circle at 50% 45%,#fff,#f4f0e8 60%,#e9e3d7)",
                    flexShrink: 0,
                  }}
                >
                  {item.imageUrl &&
                  !imgErrors[idx] ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      width={60}
                      height={60}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      onError={() =>
                        setImgErrors((e) => ({
                          ...e,
                          [idx]: true,
                        }))
                      }
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Georgia,serif",
                        color: "#aa8953",
                        fontSize: 20,
                      }}
                    >
                      K
                    </div>
                  )}
                </div>

                {/* Name + meta */}
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontFamily:
                        'Georgia, "Times New Roman", serif',
                      fontSize: 15,
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.name}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "rgba(23,23,23,.5)",
                    }}
                  >
                    Qty {item.quantity}
                    {item.size
                      ? ` · ${item.size}`
                      : ""}
                    {item.price !== undefined
                      ? ` · ${formatRs(item.price)} each`
                      : ""}
                  </p>
                </div>

                {/* Line total */}
                <div style={{ textAlign: "right" }}>
                  <strong
                    style={{ fontSize: 13 }}
                  >
                    {item.price !== undefined
                      ? formatRs(
                          item.price *
                            item.quantity
                        )
                      : "—"}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          {/* Grand total row */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 16,
              marginTop: 10,
              paddingTop: 12,
              borderTop:
                "1px solid rgba(23,23,23,.1)",
              fontSize: 13,
            }}
          >
            <span
              style={{ color: "rgba(23,23,23,.5)" }}
            >
              Order total
            </span>
            <strong
              style={{
                fontFamily:
                  'Georgia, "Times New Roman", serif',
                fontSize: 20,
                fontWeight: 400,
              }}
            >
              {formatRs(total)}
            </strong>
          </div>
        </div>
      )}

    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function splitNotes(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToText(value: unknown) {
  return Array.isArray(value)
    ? value.map(String).join(", ")
    : "";
}

/* =========================================================
   SETTINGS
========================================================= */

function Settings({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="settings-page">
      <section className="settings-card profile-card">
        <div className="large-avatar">
          {profile.imageUrl ? <img src={profile.imageUrl} alt="Admin profile" /> : profile.name.slice(0, 1).toUpperCase()}
        </div>
        <h2>{profile.name}</h2>
        <p>{profile.email}</p>
        <span className="tag">Administrator</span>
      </section>
      <form className="settings-card settings-form" onSubmit={onSave}>
        <div className="settings-title">
          <span className="admin-kicker">ADMIN ACCOUNT</span>
          <h3>Profile settings</h3>
        </div>
        <div className="form-grid-2">
          <label className="form-field"><span>Admin name *</span><input name="name" defaultValue={profile.name} required autoComplete="name" /></label>
          <label className="form-field"><span>Email address *</span><input name="email" type="email" defaultValue={profile.email} required autoComplete="email" /></label>
          <label className="form-field full-field"><span>Profile image URL</span><input name="imageUrl" defaultValue={profile.imageUrl ?? ""} placeholder="https://..." type="url" /></label>
          <label className="form-field full-field"><span>New password</span><input name="password" type="password" minLength={6} autoComplete="new-password" placeholder="Leave blank to keep current password" /></label>
        </div>
        <div className="settings-actions"><button className="primary-action" type="submit">Save profile</button></div>
      </form>
    </div>
  );
}

/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(value: unknown) {
  if (!value) {
    return "—";
  }

  const date = new Date(
    String(value)
  );

  if (
    Number.isNaN(
      date.valueOf()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}