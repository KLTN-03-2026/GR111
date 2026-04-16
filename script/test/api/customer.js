async function safeFetch(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function testCustomerAPIs() {
  try {
    console.log("--- TEST: Lấy danh sách Clubs ---");
    const clubsData = await safeFetch(`${BASE_URL}/owner/clubs`, { headers });
    console.log(clubsData);

    if (clubsData.success && clubsData.data.length > 0) {
      const testClubId = clubsData.data[0].id;

      console.log(
        `\n--- TEST: Lấy danh sách khách hàng của Club: ${testClubId} ---`,
      );
      const custData = await safeFetch(
        `${BASE_URL}/owner/clubs/${testClubId}/customers`,
        { headers },
      );
      console.log(custData);

      if (custData.success && custData.data.length > 0) {
        const testUserId = custData.data[0].userId;

        console.log(
          `\n--- TEST: Update hạng khách hàng (VIP) cho user: ${testUserId} ---`,
        );
        const updateData = await safeFetch(
          `${BASE_URL}/owner/clubs/${testClubId}/customers/${testUserId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ tier: "VIP", notes: "Automated test note" }),
          },
        );
        console.log(updateData);

        console.log(`\n--- TEST: Lấy lịch sử giao dịch khách hàng ---`);
        const historyData = await safeFetch(
          `${BASE_URL}/owner/customers/${testUserId}/history?clubId=${testClubId}`,
          { headers },
        );
        console.log(historyData);
      } else {
        console.log("Không có khách hàng nào trong club này.");
      }
    } else {
      console.log("Không có club nào.");
    }
  } catch (e) {
    console.error("Error executing tests:", e);
  }
}
