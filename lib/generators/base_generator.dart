import '../models/problem.dart';

abstract class MathGenerator {
  /// 生成器的显示名称，例如 "20以内加法"
  String get name;

  /// 生成单道题目
  Problem generate();

  /// 批量生成题目
  List<Problem> generateBatch(int count) {
    return List.generate(count, (_) => generate());
  }
}
