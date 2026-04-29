const OPEN_API_BASE = "https://provinces.open-api.vn/api";

export type WardDTO = {
  code: number;
  name: string;
  divisionType: string;
};

export type DistrictDTO = {
  code: number;
  name: string;
  divisionType: string;
  wards: WardDTO[];
};

/** 63 tỉnh/TP — slug = codename từ open-api (VD: thanh_pho_ha_noi) */
export type ProvinceSummaryDTO = { slug: string; name: string; code: number };

export type ProvinceDetailDTO = {
  slug: string;
  name: string;
  districts: DistrictDTO[];
};

type OpenApiWard = {
  name: string;
  code: number;
  division_type: string;
};

type OpenApiDistrict = {
  name: string;
  code: number;
  division_type: string;
  wards?: OpenApiWard[];
};

type OpenApiProvince = {
  name: string;
  code: number;
  codename?: string;
  districts?: OpenApiDistrict[];
};

type OpenApiProvinceShallow = {
  name: string;
  code: number;
  codename: string;
  division_type: string;
};

const CACHE_MS = 1000 * 60 * 60 * 6;

let provinceListCache: { expires: number; items: ProvinceSummaryDTO[] } | null = null;

const detailCache = new Map<string, { expires: number; data: ProvinceDetailDTO }>();

async function fetchProvinceDepth3(code: number): Promise<OpenApiProvince> {
  const url = `${OPEN_API_BASE}/p/${code}?depth=3`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`provinces.open-api.vn trả lỗi ${res.status} cho mã ${code}`);
  }
  return res.json() as Promise<OpenApiProvince>;
}

async function getCachedProvinceList(): Promise<ProvinceSummaryDTO[]> {
  const now = Date.now();
  if (provinceListCache && provinceListCache.expires > now) {
    return provinceListCache.items;
  }

  const res = await fetch(`${OPEN_API_BASE}/?depth=1`, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`provinces.open-api.vn danh sách tỉnh: ${res.status}`);
  }

  const raw = (await res.json()) as OpenApiProvinceShallow[];
  const items: ProvinceSummaryDTO[] = raw.map((p) => ({
    slug: p.codename,
    name: p.name,
    code: p.code,
  }));
  items.sort((a, b) => a.name.localeCompare(b.name, "vi"));

  provinceListCache = { expires: now + CACHE_MS, items };
  return items;
}

/**
 * 63 tỉnh, thành phố trực thuộc TW (dữ liệu provinces.open-api.vn).
 */
export async function listAllProvinces(): Promise<ProvinceSummaryDTO[]> {
  return getCachedProvinceList();
}

function resolveProvinceCode(ident: string, list: ProvinceSummaryDTO[]): number | null {
  const trimmed = decodeURIComponent(ident).trim();
  if (/^\d+$/.test(trimmed)) {
    const n = parseInt(trimmed, 10);
    return list.some((p) => p.code === n) ? n : null;
  }
  const bySlug = list.find((p) => p.slug === trimmed);
  return bySlug ? bySlug.code : null;
}

/**
 * Chi tiết một tỉnh: `slug` = codename (VD: tinh_da_nang) hoặc mã số (VD: 48).
 */
export async function getProvinceDetail(ident: string): Promise<ProvinceDetailDTO | null> {
  const list = await getCachedProvinceList();
  const code = resolveProvinceCode(ident, list);
  if (code == null) return null;

  const meta = list.find((p) => p.code === code);
  const cacheKey = `p-${code}`;
  const now = Date.now();
  const hit = detailCache.get(cacheKey);
  if (hit && hit.expires > now) {
    return hit.data;
  }

  const payload = await fetchProvinceDepth3(code);

  const districts: DistrictDTO[] = (payload.districts || []).map((d) => ({
    code: d.code,
    name: d.name,
    divisionType: d.division_type,
    wards: (d.wards || []).map((w) => ({
      code: w.code,
      name: w.name,
      divisionType: w.division_type,
    })),
  }));
  districts.sort((a, b) => a.name.localeCompare(b.name, "vi"));

  const data: ProvinceDetailDTO = {
    slug: meta?.slug ?? payload.codename ?? String(code),
    name: payload.name,
    districts,
  };

  detailCache.set(cacheKey, { expires: now + CACHE_MS, data });
  return data;
}
