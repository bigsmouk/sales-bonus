function calculateSimpleRevenue(purchase, _product) {
    const discountMultiplier = 1 - (purchase.discount / 100);
    return purchase.sale_price * purchase.quantity * discountMultiplier;
}

function calculateBonusByProfit(index, total, seller) {
    const profit = seller.profit;
    if (index === 0) return profit * 0.15;
    if (index === 1 || index === 2) return profit * 0.10;
    if (index === total - 1) return 0;
    return profit * 0.05;
}

function analyzeSalesData(data, options) {
    if (!data) throw new Error('Некорректные входные данные');
    if (!Array.isArray(data.sellers) || data.sellers.length === 0) throw new Error('Некорректные входные данные');
    if (!Array.isArray(data.products) || data.products.length === 0) throw new Error('Некорректные входные данные');
    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) throw new Error('Некорректные входные данные');
    
    const { calculateRevenue, calculateBonus } = options;
    if (!calculateRevenue || !calculateBonus) throw new Error('Не переданы необходимые функции для расчетов');
    
    const sellers = data.sellers.map(s => ({
        id: s.id,
        name: s.first_name + ' ' + s.last_name,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));
    
    const sellerIndex = {};
    sellers.forEach(s => sellerIndex[s.id] = s);
    
    const productIndex = {};
    data.products.forEach(p => productIndex[p.sku] = p);
    
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count++;
        seller.revenue += record.total_amount;
        
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item, product);
            const profit = revenue - cost;
            seller.profit += profit;
            
            if (!seller.products_sold[item.sku]) seller.products_sold[item.sku] = 0;
            seller.products_sold[item.sku] += item.quantity;
        });
    });
    
    sellers.sort((a, b) => b.profit - a.profit);
    
    sellers.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellers.length, seller);
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });
    
    return sellers.map(s => ({
        seller_id: s.id,
        name: s.name,
        revenue: +s.revenue.toFixed(2),
        profit: +s.profit.toFixed(2),
        sales_count: s.sales_count,
        top_products: s.top_products,
        bonus: +s.bonus.toFixed(2)
    }));
}

module.exports = {
    calculateSimpleRevenue,
    calculateBonusByProfit,
    analyzeSalesData
};
