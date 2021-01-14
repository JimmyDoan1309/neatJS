function binaryCrossEntropy(y, yHat) {
  const result = -(y * Math.log2(yHat) + (1 - y) * Math.log2(1 - yHat));
  return result;
}
class XORAgent extends NeatAgent {
  constructor(id, args) {
    super(id, args);
  }

  predict(inp) {
    return NeatUtils.sigmoid(this.brain.predict(inp))[0];
  }

  evaluate(inputs, outputs) {
    let loss = 0;
    for (let i = 0; i < inputs.length; i++) {
      loss += binaryCrossEntropy(
        outputs[i],
        NeatUtils.sigmoid(this.brain.predict(inputs[i]))[0]
      );
    }
    this.fitness = 1 / loss + 0.00000001;
  }
  reset() {
    this.fitness = 0;
  }
}

let inputs = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

let outputs = [0, 1, 1, 0];

let pop = new Population(
  XORAgent,
  { inputDim: 2, outputDim: 1 },
  50, // population of 50
  0.5, // use top 50% of the population for crossover
  false // Not use specitation
);
for (let epoch = 0; epoch < 100; epoch++) {
  pop.population.forEach((agent) => {
    agent.evaluate(inputs, outputs);
  });
  pop.naturalSelection();
  pop.reset();
}
