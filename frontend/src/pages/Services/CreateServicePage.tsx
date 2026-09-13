import React, {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router";

type Category = {
  _id: string;
  name: string;
  status?: "active" | "inactive";
};

type StoredUser = {
  _id?: string;
  id?: string;
};

type ServiceForm = {
  title: string;
  description: string;
  categoryId: string;
  locationType:
    | "online"
    | "in_person"
    | "both";
  estimatedDurationHours: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api";

const getCurrentUserId = (): string => {
  try {
    const value = localStorage.getItem("user");

    if (!value) {
      return "";
    }

    const user = JSON.parse(value) as StoredUser;

    return user._id || user.id || "";
  } catch {
    return "";
  }
};

const CreateServicePage: React.FC = () => {
  const navigate = useNavigate();

  const currentUserId = useMemo(
    () => getCurrentUserId(),
    []
  );

  const [categories, setCategories] = useState<
    Category[]
  >([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    locationType: "both",
    estimatedDurationHours: "1",
  });

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [isAiLoading, setIsAiLoading] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${API_URL}/categories`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load categories."
          );
        }

        setCategories(
          Array.isArray(data)
            ? data.filter(
                (category: Category) =>
                  category.status !== "inactive"
              )
            : []
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load categories."
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleAiEnhance = async () => {
    if (!form.description || form.description.trim().length < 5) {
      setError("Please write a short description first so the AI has something to improve!");
      return;
    }

    try {
      setIsAiLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/ai/optimize-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rawDescription: form.description,
            categories: categories.map(
              (category) => category.name
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "AI service failed"
        );
      }

      setForm((prev) => {
        const next = {
          ...prev,
          title: data.title || prev.title,
          description:
            data.enhancedDescription ||
            prev.description,
        };

        if (
          data.category &&
          (!prev.categoryId ||
            prev.categoryId === "missing")
        ) {
          const match = categories.find(
            (category) =>
              category.name.toLowerCase() ===
              String(data.category)
                .trim()
                .toLowerCase()
          );

          if (match) {
            next.categoryId = match._id;
          }
        }

        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI enhancement failed."
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (!currentUserId) {
        throw new Error(
          "Please log in before creating a service."
        );
      }

      const response = await fetch(
        `${API_URL}/services`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            providerId: currentUserId,
            categoryId: form.categoryId,
            title: form.title,
            description: form.description,
            locationType: form.locationType,
            estimatedDurationHours: Number(
              form.estimatedDurationHours
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create service."
        );
      }

      navigate("/my-services");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create service."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            ADD SERVICE
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a new service for other members.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">
              Service Title
            </label>

            <input
              required
              maxLength={150}
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              placeholder="Example: React tutoring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Category
            </label>

            <select
              required
              disabled={loadingCategories}
              value={form.categoryId}
              onChange={(event) =>
                setForm({
                  ...form,
                  categoryId: event.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="">
                {loadingCategories
                  ? "Loading categories..."
                  : "Select a category"}
              </option>

              {categories.map((category) => (
                <option
                  key={category._id}
                  value={category._id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium">
                Description
              </label>

              <button
                type="button"
                onClick={handleAiEnhance}
                disabled={isAiLoading}
                className="flex items-center gap-1 rounded-md bg-purple-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {isAiLoading
                  ? "Optimizing..."
                  : "Enhance with AI"}
              </button>
            </div>

            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description: event.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              placeholder="Describe what you will offer..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Location Type
            </label>

            <select
              value={form.locationType}
              onChange={(event) =>
                setForm({
                  ...form,
                  locationType: event.target
                    .value as ServiceForm["locationType"],
                })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="online">
                Online
              </option>

              <option value="in_person">
                In person
              </option>

              <option value="both">
                Online or in person
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Estimated Duration
            </label>

            <input
              required
              type="number"
              min="1"
              step="1"
              value={
                form.estimatedDurationHours
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  estimatedDurationHours:
                    event.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            />

            <p className="mt-1 text-xs text-gray-400">
              Duration is measured in hours.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t pt-5 dark:border-gray-700">
            <Link
              to="/my-services"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting
                ? "Creating..."
                : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateServicePage;