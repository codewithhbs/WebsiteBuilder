import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import ImagePicker from "../../components/ImagePicker";

const SCHEMAS = {
  seo: {
    title: "SEO",
    icon: "bi-search",

    image: "ogImage",

    extraImages: [
      {
        key: "twitterImage",
        label: "Twitter Image",
      },
    ],

    fields: [
      {
        name: "title",
        label: "Page Title",
        type: "text",
        required: true,
        max: 70,
        help: "Recommended 50-70 characters",
      },

      {
        name: "description",
        label: "Meta Description",
        type: "textarea",
        rows: 4,
        required: true,
        max: 160,
        help: "Recommended 140-160 characters",
      },

      {
        name: "canonicalUrl",
        label: "Canonical URL",
        type: "url",
        required: true,
        placeholder: "https://example.com",
      },

      {
        name: "robots",
        label: "Robots",
        type: "select",
        options: [
          "index, follow",
          "noindex, follow",
          "index, nofollow",
          "noindex, nofollow",
        ],
      },

      {
        name: "author",
        label: "Author",
        type: "text",
      },

      {
        name: "language",
        label: "Language",
        type: "text",
        placeholder: "en",
      },

      {
        name: "ogTitle",
        label: "OG Title",
        type: "text",
        max: 70,
      },

      {
        name: "ogDescription",
        label: "OG Description",
        type: "textarea",
        rows: 3,
        max: 200,
      },

      {
        name: "ogType",
        label: "OG Type",
        type: "select",
        options: [
          "website",
          "article",
          "blog",
          "product",
        ],
      },

      {
        name: "ogUrl",
        label: "OG URL",
        type: "url",
      },

      {
        name: "twitterCard",
        label: "Twitter Card",
        type: "select",
        options: [
          "summary",
          "summary_large_image",
        ],
      },

      {
        name: "twitterTitle",
        label: "Twitter Title",
        type: "text",
        max: 70,
      },

      {
        name: "twitterDescription",
        label: "Twitter Description",
        type: "textarea",
        rows: 3,
        max: 200,
      },

      {
        name: "revisitAfter",
        label: "Revisit After",
        type: "text",
        placeholder: "7 days",
      },

      {
        name: "rating",
        label: "Rating",
        type: "text",
        placeholder: "general",
      },

      {
        name: "distribution",
        label: "Distribution",
        type: "text",
        placeholder: "global",
      },

      {
        name: "schemaType",
        label: "Schema Type",
        type: "select",
        options: [
          "WebPage",
          "Article",
          "BlogPosting",
          "Organization",
          "Product",
          "LocalBusiness",
        ],
      },
    ],

    list: {
      name: "keywords",
      label: "Keywords",
      help: "One keyword per line",
    },
  },
};

export default function SeoSection({
  site,
  section,
  reload,
}) {
  const schema = SCHEMAS[section];

  const initial = site?.[section] || {};

  const [form, setForm] = useState(() => {
    const obj = {};

    schema.fields.forEach((f) => {
      obj[f.name] =
        initial[f.name] || "";
    });

    if (schema.list) {
      obj[schema.list.name] = (
        initial[schema.list.name] || []
      ).join("\n");
    }

    return obj;
  });

  const [imgFile, setImgFile] =
    useState({});

  const [saving, setSaving] =
    useState(false);

  const save = async () => {
    try {
      setSaving(true);

      // VALIDATION

      for (const field of schema.fields) {
        const value = form[field.name];

        if (
          field.required &&
          (!value ||
            !String(value).trim())
        ) {
          toast.error(
            `${field.label} is required`
          );

          setSaving(false);
          return;
        }

        if (
          field.max &&
          value &&
          value.length > field.max
        ) {
          toast.error(
            `${field.label} max ${field.max} characters`
          );

          setSaving(false);
          return;
        }
      }

      const payload = {};

      schema.fields.forEach((f) => {
        payload[f.name] =
          form[f.name];
      });

      if (schema.list) {
        payload[schema.list.name] =
          form[schema.list.name]
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
      }

      const fd = new FormData();

      fd.append(
        "payload",
        JSON.stringify(payload)
      );

      // MAIN IMAGE

      if (
        schema.image &&
        imgFile?.[schema.image]
      ) {
        fd.append(
          schema.image,
          imgFile[schema.image]
        );
      }

      // EXTRA IMAGES

      schema.extraImages?.forEach(
        (img) => {
          if (imgFile?.[img.key]) {
            fd.append(
              img.key,
              imgFile[img.key]
            );
          }
        }
      );

      await api.patch(
        `/employee/websites/${site._id}/section/${section}`,
        fd
      );

      toast.success(
        `${schema.title} updated successfully`
      );

      reload();

    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to save SEO"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid">

      {/* HEADER */}

      <div className="d-flex align-items-center mb-4">
        <i
          className={`bi ${schema.icon} text-primary fs-4 me-2`}
        ></i>

        <div>
          <h4 className="mb-0">
            {schema.title}
          </h4>

          <small className="text-muted">
            Optimize website indexing
            and search engine visibility
          </small>
        </div>
      </div>

      {/* OG IMAGE */}

      {schema.image && (
        <div className="mb-4">
          <ImagePicker
            label="OG Image"
            currentUrl={
              initial?.[
                schema.image
              ]?.url
            }
            onChange={(file) =>
              setImgFile((prev) => ({
                ...prev,
                [schema.image]: file,
              }))
            }
          />
        </div>
      )}

      {/* EXTRA IMAGES */}

      {schema.extraImages?.map(
        (img) => (
          <div
            className="mb-4"
            key={img.key}
          >
            <ImagePicker
              label={img.label}
              currentUrl={
                initial?.[img.key]
                  ?.url
              }
              onChange={(file) =>
                setImgFile(
                  (prev) => ({
                    ...prev,
                    [img.key]:
                      file,
                  })
                )
              }
            />
          </div>
        )
      )}

      {/* FIELDS */}

      <div className="row">

        {schema.fields.map((f) => (
          <div
            className={
              f.type ===
                "textarea"
                ? "col-12"
                : "col-md-6"
            }
            key={f.name}
          >
            <div className="mb-4">

              <div className="d-flex justify-content-between align-items-center mb-1">

                <label className="form-label fw-semibold mb-0">
                  {f.label}

                  {f.required && (
                    <span className="text-danger ms-1">
                      *
                    </span>
                  )}
                </label>

                {f.max && (
                  <small className="text-muted">
                    {
                      (
                        form[
                          f.name
                        ] || ""
                      ).length
                    }
                    /{f.max}
                  </small>
                )}

              </div>

              {f.type ===
              "textarea" ? (
                <textarea
                  className="form-control"
                  rows={f.rows || 3}
                  maxLength={f.max}
                  placeholder={
                    f.placeholder
                  }
                  value={
                    form[f.name]
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [f.name]:
                        e.target
                          .value,
                    })
                  }
                />
              ) : f.type ===
                "select" ? (
                <select
                  className="form-select"
                  value={
                    form[f.name] ||
                    ""
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [f.name]:
                        e.target
                          .value,
                    })
                  }
                >
                  <option value="">
                    Select{" "}
                    {f.label}
                  </option>

                  {f.options.map(
                    (opt) => (
                      <option
                        key={opt}
                        value={opt}
                      >
                        {opt}
                      </option>
                    )
                  )}
                </select>
              ) : (
                <input
                  type={f.type}
                  className="form-control"
                  maxLength={
                    f.max
                  }
                  placeholder={
                    f.placeholder
                  }
                  value={
                    form[f.name]
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [f.name]:
                        e.target
                          .value,
                    })
                  }
                />
              )}

              {f.help && (
                <div className="form-text">
                  {f.help}
                </div>
              )}

            </div>
          </div>
        ))}

      </div>

      {/* KEYWORDS */}

      {schema.list && (
        <div className="mb-4">

          <label className="form-label fw-semibold">
            {schema.list.label}
          </label>

          <textarea
            className="form-control"
            rows="5"
            value={
              form[
                schema.list.name
              ]
            }
            onChange={(e) =>
              setForm({
                ...form,
                [schema.list.name]:
                  e.target.value,
              })
            }
            placeholder="seo
web development
react js"
          />

          <div className="form-text">
            {schema.list.help}
          </div>

        </div>
      )}

      {/* SAVE BUTTON */}

      <button
        className="btn btn-primary px-4"
        onClick={save}
        disabled={saving}
      >
        {saving ? (
          <>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Saving...
          </>
        ) : (
          <>
            <i className="bi bi-check-lg me-2"></i>
            Save SEO Settings
          </>
        )}
      </button>

    </div>
  );
}