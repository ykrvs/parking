import assert from "node:assert/strict";
import test from "node:test";

import {
  assertOriginalDriverCanDriveOut,
  assertVehicleFacilityAllowed,
  buildVehicleCheckInPayload,
  pickVehicleUpdateData,
  resolveRequestedFacilityForProfile,
} from "../lib/vehicles/rules";

test("only the original driver can drive out a vehicle by driver id", () => {
  assert.doesNotThrow(() =>
    assertOriginalDriverCanDriveOut(
      { id: "driver-1", name: "Driver One" },
      { driver_id: "driver-1", driver: "Someone Else" },
    ),
  );

  assert.throws(
    () =>
      assertOriginalDriverCanDriveOut(
        { id: "driver-2", name: "Driver Two" },
        { driver_id: "driver-1", driver: "Driver Two" },
      ),
    /Only the driver who logged this vehicle in can drive it out/,
  );
});

test("legacy drive-out ownership falls back to the stored driver name", () => {
  assert.doesNotThrow(() =>
    assertOriginalDriverCanDriveOut(
      { id: "new-user-id", name: "  Lim Kai  " },
      { driver: "lim kai" },
    ),
  );

  assert.throws(
    () =>
      assertOriginalDriverCanDriveOut(
        { id: "new-user-id", name: "Tan Wei" },
        { driver: "Lim Kai" },
      ),
    /Only the driver who logged this vehicle in can drive it out/,
  );
});

test("optional readings stay optional for check-in payloads", () => {
  const payload = buildVehicleCheckInPayload({
    id: "11FMD-087",
    facilityCode: "11FMD",
    actorId: "driver-1",
    checkIn: "2026-07-20T08:00:00.000Z",
    body: {
      level: "L1",
      lot: " a1 ",
      odometer: "",
      engine_hours: undefined,
      starter_v: null,
      starter_pct: "",
      aux_v: "",
      aux_pct: "",
      fuel_l: "",
      fuel_pct: "",
      fire_ext_expiry: "",
      next_servicing: "",
    },
  });

  assert.equal(payload.odometer, null);
  assert.equal(payload.engine_hours, null);
  assert.equal(payload.starter_v, null);
  assert.equal(payload.starter_pct, null);
  assert.equal(payload.aux_v, null);
  assert.equal(payload.aux_pct, null);
  assert.equal(payload.fuel_l, null);
  assert.equal(payload.fuel_pct, null);
  assert.equal(payload.fire_ext_expiry, null);
  assert.equal(payload.next_servicing, null);
});

test("optional readings stay optional for vehicle updates", () => {
  const update = pickVehicleUpdateData({
    odometer: "",
    engine_hours: "",
    starter_v: "",
    starter_pct: "",
    aux_v: "",
    aux_pct: "",
    fuel_l: "",
    fuel_pct: "",
    lot: " b7 ",
  });

  assert.deepEqual(update, {
    odometer: null,
    engine_hours: null,
    starter_v: null,
    starter_pct: null,
    aux_v: null,
    aux_pct: null,
    fuel_l: null,
    fuel_pct: null,
    lot: "B7",
  });
});

test("vehicle unit is trimmed when present and nulled when blank", () => {
  const withUnit = buildVehicleCheckInPayload({
    id: "11FMD-088",
    facilityCode: "11FMD",
    actorId: "driver-1",
    checkIn: "2026-07-20T08:00:00.000Z",
    body: { level: "L1", lot: "A2", vehicle_unit: "  Alpha Platoon  " },
  });

  const withoutUnit = buildVehicleCheckInPayload({
    id: "11FMD-089",
    facilityCode: "11FMD",
    actorId: "driver-1",
    checkIn: "2026-07-20T08:00:00.000Z",
    body: { level: "L1", lot: "A3", vehicle_unit: "   " },
  });

  assert.equal(withUnit.vehicle_unit, "Alpha Platoon");
  assert.equal(withoutUnit.vehicle_unit, null);

  assert.deepEqual(
    pickVehicleUpdateData({
      vehicle_unit: "  Bravo Platoon  ",
      next_servicing: "",
      fire_ext_expiry: "",
    }),
    {
      vehicle_unit: "Bravo Platoon",
      next_servicing: null,
      fire_ext_expiry: null,
    },
  );
});

test("facility resolution locks normal users to their own facility", () => {
  const facility = resolveRequestedFacilityForProfile(
    { id: "user-1", facility_code: "11FMD", is_admin: false },
    "10FMD",
    [{ code: "10FMD" }],
  );

  assert.equal(facility, "11FMD");
});

test("admins can select known facilities but fall back on unknown facilities", () => {
  const admin = { id: "admin-1", facility_code: "11FMD", is_admin: true };

  assert.equal(
    resolveRequestedFacilityForProfile(admin, "10FMD", [{ code: "10FMD" }]),
    "10FMD",
  );
  assert.equal(
    resolveRequestedFacilityForProfile(admin, "NOPE", [{ code: "10FMD" }]),
    "11FMD",
  );
});

test("facility access blocks regular users from other depots and allows admins", () => {
  assert.throws(
    () =>
      assertVehicleFacilityAllowed(
        { id: "user-1", facility_code: "11FMD", is_admin: false },
        "10FMD",
      ),
    /different depot/,
  );

  assert.doesNotThrow(() =>
    assertVehicleFacilityAllowed(
      { id: "admin-1", facility_code: "11FMD", is_admin: true },
      "10FMD",
    ),
  );
});
