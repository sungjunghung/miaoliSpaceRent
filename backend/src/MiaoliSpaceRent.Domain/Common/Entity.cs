namespace MiaoliSpaceRent.Domain.Common;

/// <summary>
/// 所有領域實體的基底類別。實體以身分（Id）辨識，而非以屬性值。
/// </summary>
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
}
