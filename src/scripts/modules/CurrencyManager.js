exports.parseToBRL = (text) => {
    const revenueNumber = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(text);

      return revenueNumber
}

exports.reset = (text) => {
  const revenueNumber = new Intl.NumberFormat().format(text);

  return revenueNumber
}