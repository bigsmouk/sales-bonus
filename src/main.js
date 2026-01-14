function calculateSimpleRevenue(purchase, _product) {
    const discountMultiplier = 1 - (purchase.discount / 100);
    return purchase.sale_price * purchase.quantity * discountMultiplier;
}

function calculateBonusByProfit(index, total, seller) {
    const profit = seller.profit;
    
    if (index === 0) {
        return profit * 0.15;
    }
    
    if (index === 1 || index === 2) {
        return profit * 0.10;
    }
    
    const lastPlaceIndex = total - 1;
    if (index === lastPlaceIndex) {
        return 0;
    }
    
    return profit * 0.05;
}
function analyzeSalesData(data, options) {
    if (!data) {
        throw new Error('Некорректные входные данные');
    }
    
    if (!data.sellers || data.sellers.length === 0) {
        throw new Error('Некорректные входные данные');
    }
    
    if (!data.products || data.products.length === 0) {
        throw new Error('Некорректные входные данные');
    }
    
    if (!data.purchase_records || data.purchase_records.length === 0) {
        throw new Error('Некорректные входные данные');
    }

    const { calculateRevenue, calculateBonus } = options;
    
    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Не переданы необходимые функции для расчетов');
    }
    
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));
    
    const sellerIndex = {};
    sellerStats.forEach(seller => {
        sellerIndex[seller.id] = seller;
    });
    
    const productIndex = {};
    data.products.forEach(product => {
        productIndex[product.sku] = product;
    });
    
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        
        seller.sales_count += 1;
        seller.revenue += record.total_amount;
        
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item, product);
            const profit = revenue - cost;
            
            seller.profit += profit;
            
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });
    
    sellerStats.sort((a, b) => b.profit - a.profit);
    
    const totalSellers = sellerStats.length;
    
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, totalSellers, seller);
        
        const topProducts = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
        
        seller.top_products = topProducts;
    });
    
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}

module.exports = {
    calculateSimpleRevenue,
    calculateBonusByProfit,
    analyzeSalesData
};
