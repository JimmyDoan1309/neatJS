let WEIGHT_MUTATE_CHANCE = 0.8;
let BIAS_MUTATE_CHANCE = 0.8;
let WEIGHT_BIAS_RESET_CHANCE = 0.05;
let NEW_CONN_MUTATE_CHANCE = 0.1;
let NEW_NODE_MUTATE_CHANCE = 0.05;
let HIDDEN_ACTIVATION = "relu";
let KEEP_RATIO = 0.3;

let SPECIES_TOPOLOGY_COEF = 0.3;
let SPECIES_WEIGHT_COEF = 3;
let SPECIES_THRESHOLD = 5;
let SPECIES_EXTINCT_AFTER = 15;

let INNOVATION_NUMBER = 1;
let INNOVATION_CACHE = {};

const NeatUtils = {
  sigmoid: (z) => {
    if (z.constructor == Array) {
      let result = [];
      z.forEach((value) => {
        result.push(1 / (1 + Math.exp(-value)));
      });
      return result;
    } else if (z.constructor == Number) {
      return 1 / (1 + Math.exp(-z));
    }
  },

  softmax: (z) => {
    let denominator = 0;
    let result = [];
    z.forEach((value) => {
      denominator += Math.exp(value);
    });
    z.forEach((value) => {
      result.push(Math.exp(value) / denominator);
    });

    return result;
  },

  randomNormal: (mean = 0.0, std = 1.0) => {
    let u1 = Math.random();
    let u2 = Math.random();
    let z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z * std + mean;
  },

  argMax: (values) => {
    let max = -Infinity;
    let maxIndex = 0;
    values.forEach((value, index) => {
      if (value > max) {
        max = value;
        maxIndex = index;
      }
    });
    return maxIndex;
  },
};

class Node {
  constructor(
    nodeId,
    layer,
    isOuput = false,
    activation = HIDDEN_ACTIVATION,
    bias = null
  ) {
    this.nodeId = nodeId;
    this.layer = layer;
    this.isOuput = isOuput;
    this.bias = bias != null ? bias : NeatUtils.randomNormal();
    this.activation = activation;
    this.outputValue = 0;
    this.inputValue = 0;
    this.outputConnections = [];
  }

  forward() {
    if (this.layer != 0)
      this.outputValue = this.activate(this.inputValue + this.bias);
    for (let conn of this.outputConnections) {
      if (conn.enable) {
        conn.toNode.inputValue += conn.weight * this.outputValue; // weighted output sum
      }
    }
  }

  mutateBias() {
    let rand = Math.random();
    if (rand < WEIGHT_BIAS_RESET_CHANCE) {
      this.bias = NeatUtils.randomNormal();
    } else {
      this.bias += NeatUtils.randomNormal(0, 0.3);
    }
  }

  activate(value) {
    switch (this.activation) {
      case "sigmoid":
        return 1 / (1 + Math.exp(-4.9 * value)); // Modified Sigmoid based on the original paper
      case "tanh":
        return Math.tanh(value);
      case "relu":
        return value < 0 ? 0 : value;
      case "lrelu":
        return value < 0 ? value * 0.3 : value;
      case "linear":
        return value;
    }
  }

  clone() {
    let clone = new Node(
      this.nodeId,
      this.layer,
      this.isOuput,
      this.activation,
      this.bias
    );
    return clone;
  }
}

class Connection {
  constructor(fromNode, toNode, weight = null, enable = true) {
    this.fromNode = fromNode;
    this.toNode = toNode;
    this.weight = weight != null ? weight : NeatUtils.randomNormal();
    this.enable = enable;
    this.innovation = 0;
    this.assignInnovation();
  }

  mutateWeight() {
    let rand = Math.random();
    if (rand < WEIGHT_BIAS_RESET_CHANCE) {
      this.weight = NeatUtils.randomNormal();
    } else {
      this.weight += NeatUtils.randomNormal(0, 0.3);
    }
  }

  clone(fromNode, toNode) {
    return new Connection(fromNode, toNode, this.weight, this.enable);
  }

  assignInnovation() {
    let key = `${this.fromNode.nodeId}_${this.toNode.nodeId}`;
    if (INNOVATION_CACHE.hasOwnProperty(key)) {
      this.innovation = INNOVATION_CACHE[key];
    } else {
      this.innovation = INNOVATION_NUMBER;
      INNOVATION_NUMBER++;
      INNOVATION_CACHE[key] = this.innovation;
    }
  }
}

class Genome {
  constructor(inputDim, outputDim, isOffSpring = false) {
    this.inputDim = inputDim;
    this.outputDim = outputDim;

    this.nodes = [];
    this.connections = [];

    this.layerCount = 2; // Initial Genome contains only 2 layers: input & output

    this.nodeCount = 0;

    // Create a fully connected network of non-offspring genome (initial genomes)
    if (!isOffSpring) {
      for (let i = 0; i < this.inputDim; i++) {
        this.nodes.push(new Node(this.nodeCount, 0)); // Layer 0 is the input layer
        this.nodeCount++;
      }

      for (let i = 0; i < this.outputDim; i++) {
        this.nodes.push(new Node(this.nodeCount, Infinity, true, "linear")); // layer Infinity is the output layer
        this.nodeCount++;
      }

      for (let i = 0; i < this.inputDim; i++) {
        for (let j = this.inputDim; j < this.nodes.length; j++) {
          this.connections.push(new Connection(this.nodes[i], this.nodes[j]));
        }
      }
    }
  }

  refresh() {
    this.nodes.forEach((node) => {
      node.outputConnections = [];
      node.inputValue = 0;
      node.outputValue = 0;
    });
    this.connections.forEach((conn) => {
      conn.fromNode.outputConnections.push(conn);
    });

    // Sort the nodes list so the forward calculation happens in correct order.
    this.sortLayers();
  }

  predict(inputValues) {
    if (inputValues.length !== this.inputDim) {
      throw Error(
        "Mismatch size between inputValues and number of input nodes"
      );
    }

    // refresh all node/connections
    this.refresh();

    // put obsered inputs to input nodes' outputValue
    // because these nodes doesn't have prev nodes
    for (let i = 0; i < this.inputDim; i++) {
      this.nodes[i].outputValue = inputValues[i];
    }

    let result = [];
    this.nodes.forEach((node) => {
      node.forward();
      if (node.isOuput) {
        result.push(node.outputValue);
      }
    });
    return result;
  }

  mutate() {
    // Mutate weight
    this.connections.forEach((conn) => {
      if (Math.random() < WEIGHT_MUTATE_CHANCE) {
        conn.mutateWeight();
      }
    });

    this.nodes.forEach((node) => {
      // Mutate bias
      if (Math.random() < BIAS_MUTATE_CHANCE) {
        node.mutateBias();
      }
    });

    if (Math.random() < NEW_CONN_MUTATE_CHANCE) this.addConnection();

    if (Math.random() < NEW_NODE_MUTATE_CHANCE) this.addNode();
  }

  // TODO: better way to find 2 nodes that are not connected;
  // Current method will miss when node1 is connected to every other nodes
  // This doesn't mean every others nodes also connect to each other.
  addConnection() {
    let node1 = this.nodes[Math.floor(Math.random() * this.nodes.length)];
    let unconnected = [];
    this.nodes.forEach((node2) => {
      if (node1.layer != node2.layer && !this.isConnected(node1, node2)) {
        unconnected.push(node2);
      }
    });

    if (unconnected.length === 0) {
      return;
    }

    let node2 = unconnected[Math.floor(Math.random() * unconnected.length)];

    if (node1.layer > node2.layer) {
      let tmp = node2;
      node2 = node1;
      node1 = tmp;
    }

    this.connections.push(new Connection(node1, node2));
  }

  addNode() {
    // Pick a random connection to replace with a new node;
    let conn = this.connections[
      Math.floor(Math.random() * this.connections.length)
    ];
    conn.enable = false;

    let layer = conn.fromNode.layer + 1;

    let newNode = new Node(this.nodeCount, layer, false, HIDDEN_ACTIVATION, 0);
    this.nodes.forEach((node) => {
      if (node.layer > conn.fromNode.layer) node.layer++;
    });

    let newConn1 = new Connection(conn.fromNode, newNode, 1.0);
    let newConn2 = new Connection(newNode, conn.toNode, conn.weight);

    this.nodes.push(newNode);
    this.connections.push(newConn1, newConn2);

    this.layerCount++;
    this.nodeCount++;
  }

  crossover(partner) {
    let child = new Genome(this.inputDim, this.outputDim, true);
    child.layerCount = Math.max(this.layerCount, partner.layerCount);

    let cache = {};
    this.connections.forEach((conn) => {
      cache[conn.innovation] = [conn];
    });
    partner.connections.forEach((conn) => {
      if (cache.hasOwnProperty(conn.innovation)) {
        cache[conn.innovation].push(conn);
      } else {
        cache[conn.innovation] = [conn];
      }
    });

    let nodeCache = {};
    for (let [_, conns] of Object.entries(cache)) {
      let conn = conns[Math.floor(Math.random() * conns.length)];

      if (!nodeCache.hasOwnProperty(conn.fromNode.nodeId)) {
        child.nodes.push(conn.fromNode.clone());
        child.nodeCount++;
        nodeCache[conn.fromNode.nodeId] = true;
      }

      if (!nodeCache.hasOwnProperty(conn.toNode.nodeId)) {
        child.nodes.push(conn.toNode.clone());
        child.nodeCount++;
        nodeCache[conn.toNode.nodeId] = true;
      }

      let fromNode = child.getNode(conn.fromNode.nodeId);
      let toNode = child.getNode(conn.toNode.nodeId);
      child.connections.push(conn.clone(fromNode, toNode));
    }

    return child;
  }

  containGene(innovation, connections) {
    for (let conn of connections) {
      if (conn.innovation === innovation) {
        return true;
      }
    }
    return false;
  }

  clone() {
    let clone = new Genome(this.inputDim, this.outputDim, this.isOffSpring);
    clone.layerCount = this.layerCount;
    clone.nodeCount = this.nodeCount;
    clone.nodes = this.nodes.slice(0, this.nodes.length);
    clone.connections = this.connections.slice(0, this.connections.length);
    return clone;
  }

  sortLayers() {
    this.nodes.sort((a, b) => {
      return a.layer - b.layer;
    });
  }

  printConnections() {
    this.connections.forEach((conn) => {
      if (conn.enable)
        console.log(
          `${conn.fromNode.nodeId} -> ${conn.toNode.nodeId} || (${conn.fromNode.layer}) -> (${conn.toNode.layer})`
        );
    });
  }

  isConnected(node1, node2) {
    for (let conn of this.connections) {
      if (
        conn.fromNode.nodeId === node1.nodeId &&
        conn.toNode.nodeId === node2.nodeId
      )
        return true;
      if (
        conn.fromNode.nodeId === node2.nodeId &&
        conn.toNode.nodeId === node1.nodeId
      )
        return true;
    }
    return false;
  }

  getNode(nodeId) {
    for (let node of this.nodes) {
      if (node.nodeId === nodeId) {
        return node;
      }
    }
    return null;
  }

  getConnection(nodeId1, nodeId2) {
    for (let conn of this.connections) {
      if (conn.fromNode.nodeId === nodeId1 && conn.toNode.nodeId === nodeId2)
        return conn;
      if (conn.fromNode.nodeId === nodeId2 && conn.toNode.nodeId === nodeId1)
        return conn;
    }
    return null;
  }

  getEnableConnections() {
    return this.connections.filter((conn) => {
      if (conn.enable) return conn;
    });
  }
}

class NeatAgent {
  constructor(id, args) {
    this.id = id;
    this.args = args;
    this.brain = new Genome(args.inputDim, args.outputDim);
    this.fitness = 0;
  }

  reset() {
    throw Error("This function must be implemented by child class");
  }

  clone() {
    let clone = new this.constructor(this.id, this.args);
    clone.brain = this.brain.clone();
    clone.fitness = this.fitness;
    return clone;
  }
}

class Species {
  constructor(id) {
    this.id = id;
    this.representer = null;
    this.members = [];
    this.avgFitness = 0;
    this.bestFitness = -Infinity;
    this.extinctCounter = 0;
  }

  calculateFitness() {
    if (this.members.length === 0) return 0;
    let fitnessSum = 0;
    this.members.forEach((mem) => {
      fitnessSum += mem.fitness;
    });
    this.avgFitness = fitnessSum / this.members.length;
    return this.avgFitness;
  }

  isImprove() {
    if (this.avgFitness > this.bestFitness) {
      this.bestFitness = this.avgFitness;
      this.extinctCounter = 0;
      return true;
    }
    if (this.extinctCounter < SPECIES_EXTINCT_AFTER) {
      this.extinctCounter++;
      return true;
    }
    return false;
  }

  // Sort members by fitness score
  sortMembers(order = "desc") {
    this.members.sort((a, b) => {
      if (order == "desc") return b.fitness - a.fitness;
      else return a.fitness - b.fitness;
    });
  }
}

class Population {
  constructor(
    agentCls,
    agentArgs,
    populationSize,
    keepRatio = KEEP_RATIO,
    specitation = false
  ) {
    this.population = [];
    this.bestAgent;
    this.bestFitness = -Infinity;
    this.generation = 1;

    this.agentCls = agentCls;
    this.agentArgs = agentArgs;
    this.agentCounter = 0;

    this.populationSize = populationSize;
    this.keepRatio = keepRatio;

    this.specitation = specitation;
    if (specitation) {
      this.speciesTable = [];
      this.speciesCounter = 0;
    }

    for (let i = 0; i < this.populationSize; i++) {
      this.population.push(
        new this.agentCls(this.agentCounter, this.agentArgs)
      );
      this.agentCounter++;

      // mutation so the population has some variation initially
      this.population[i].brain.mutate();

      if (specitation) this.addMemberToSpecies(this.population[i]);
    }
  }

  naturalSelection() {
    if (this.specitation) this.naturalSelectionWithSpecitation();
    else this.naturalSelectionWithoutSpecitation();
  }

  naturalSelectionWithoutSpecitation() {
    this.sortAgents();

    let keepSize = Math.ceil(this.population.length * this.keepRatio);
    let matingPool = this.population.slice(0, keepSize);
    this.population.splice(keepSize, this.populationSize - keepSize);

    let currentTopAgent = this.population[0];
    if (currentTopAgent.fitness > this.bestFitness) {
      this.bestFitness = currentTopAgent.fitness;
      this.bestAgent = currentTopAgent.clone();
    }

    for (let i = 0; i < this.populationSize - keepSize; i++) {
      let parent1 = matingPool[Math.floor(Math.random() * matingPool.length)];
      let parent2 = matingPool[Math.floor(Math.random() * matingPool.length)];

      let child = new this.agentCls(this.agentCounter, this.agentArgs);
      this.agentCounter++;

      child.brain = parent1.brain.crossover(parent2.brain);
      child.brain.mutate();

      this.population.push(child);
    }

    this.generation++;
  }

  naturalSelectionWithSpecitation() {
    let removeAgents = [];
    let removeSpecies = [];

    for (let species of this.speciesTable) {
      species.sortMembers();
      species.calculateFitness();

      if (!species.isImprove()) {
        removeSpecies.push(species);
        removeAgents.push(...species.members);
        continue;
      }

      species.representer = species.members[0];

      let keepSize = Math.ceil(this.keepRatio * species.members.length);

      let tmp = species.members.splice(
        keepSize,
        species.members.length - keepSize
      );
      removeAgents.push(...tmp);
    }

    this.speciesTable = this.speciesTable.filter(
      (species) => !removeSpecies.includes(species)
    );

    if (this.speciesTable.length > 0) {
      this.population = this.population.filter(
        (agent) => !removeAgents.includes(agent)
      );
      this.sortAgents();
    } else {
      let keepSize = Math.ceil(this.populationSize * this.keepRatio);
      this.sortAgents();
      this.population.splice(keepSize, this.populationSize - keepSize);
    }

    let currentTopAgent = this.population[0];
    if (currentTopAgent.fitness > this.bestFitness) {
      this.bestFitness = currentTopAgent.fitness;
      this.bestAgent = currentTopAgent.clone();
    }

    let matingPool = this.population.slice();

    for (let i = 0; i < this.populationSize - matingPool.length; i++) {
      let parent1 = matingPool[Math.floor(Math.random() * matingPool.length)];
      let parent2 = matingPool[Math.floor(Math.random() * matingPool.length)];

      let child = new this.agentCls(this.agentCounter, this.agentArgs);
      this.agentCounter++;

      child.brain = parent1.brain.crossover(parent2.brain);
      child.brain.mutate();

      this.population.push(child);
      this.addMemberToSpecies(child);
    }

    this.generation++;
  }

  createNewSpecies(representer) {
    let newSpecies = new Species(this.speciesCounter);
    newSpecies.members.push(representer);
    newSpecies.representer = representer;

    this.speciesTable.push(newSpecies);
    this.speciesCounter++;
  }

  addMemberToSpecies(agent) {
    for (let species of this.speciesTable) {
      if (species.representer.id === agent.id) return;
    }
    for (let species of this.speciesTable) {
      let compatScore = this.checkCompatibilityScore(
        species.representer,
        agent
      );
      if (compatScore <= SPECIES_THRESHOLD) {
        species.members.push(agent);
        return;
      }
    }
    this.createNewSpecies(agent);
  }

  checkCompatibilityScore(agent1, agent2) {
    let cache = {};

    agent1.brain.connections.forEach((conn) => {
      if (!cache.hasOwnProperty(conn.innovation)) {
        cache[conn.innovation] = [conn];
      }
    });

    agent2.brain.connections.forEach((conn) => {
      if (!cache.hasOwnProperty(conn.innovation)) {
        cache[conn.innovation] = [conn];
      } else {
        cache[conn.innovation].push(conn);
      }
    });

    let maxGenes = Math.max(
      agent1.brain.connections.length,
      agent2.brain.connections.length
    );

    let weightDifference = 0;
    let commonGenes = 0;
    let excessGenes = 0;

    for (let [_, conns] of Object.entries(cache)) {
      if (conns.length > 1) {
        weightDifference += Math.abs(conns[0].weight - conns[1].weight);
        commonGenes++;
      } else {
        excessGenes++;
      }
    }

    let score =
      (SPECIES_TOPOLOGY_COEF * excessGenes) / maxGenes +
      (SPECIES_WEIGHT_COEF * weightDifference) / commonGenes;
    return score;
  }

  getAgentById(id) {
    for (let agent of this.population) {
      if (agent.id === id) return agent;
    }
    return null;
  }

  getCurrentBestAgent() {
    let currentBest = this.population[0];
    this.population.forEach((agent) => {
      if (agent.fitness > currentBest.fitness) {
        currentBest = agent;
      }
    });
    return currentBest;
  }

  getAverageFitness() {
    let sum = 0;
    this.population.forEach((agent) => {
      sum += agent.fitness;
    });
    return sum / this.populationSize;
  }

  // Sort agents by fitness score
  sortAgents(order = "desc") {
    this.population.sort((a, b) => {
      if (order == "desc") return b.fitness - a.fitness;
      else return a.fitness - b.fitness;
    });
  }

  reset() {
    this.population.forEach((agent) => {
      agent.reset();
    });
  }
}
